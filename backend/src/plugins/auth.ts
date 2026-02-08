import { Elysia, t } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import bcrypt from 'bcryptjs';
import { eq, and } from 'drizzle-orm';
import { db } from '../config/database';
import { users, oauthAccounts } from '../db/schema';
import { env } from '../config/env';
import { google, github } from '../config/oauth';
import { generateState, generateCodeVerifier } from "arctic";
import {
  registerSchema,
  loginSchema,
  authResponseSchema,
  errorResponseSchema,
} from '../types/schemas';

export const authPlugin = new Elysia({ name: 'auth' })
  .use(
    jwt({
      name: 'jwt',
      secret: env.JWT_SECRET,
    })
  )
  .post(
    '/api/auth/register',
    async ({ body, jwt, set }) => {
      const { email, password } = body;

      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingUser.length > 0) {
        set.status = 409;
        return { success: false, error: 'Email already registered' };
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const [newUser] = await db
        .insert(users)
        .values({ email, passwordHash })
        .returning();

      const token = await jwt.sign({
        userId: newUser.id,
        email: newUser.email,
      });

      return {
        user: { id: newUser.id, email: newUser.email },
        token,
      };
    },
    {
      body: registerSchema,
      response: {
        200: authResponseSchema,
        409: errorResponseSchema,
      },
    }
  )
  .post(
    '/api/auth/login',
    async ({ body, jwt, set }) => {
      const { email, password } = body;

      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

      if (!user) {
        set.status = 401;
        return { success: false, error: 'Invalid credentials' };
      }

      if (!user.passwordHash) {
        set.status = 401;
        return { success: false, error: 'Please log in with your OAuth provider' };
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);

      if (!isValid) {
        set.status = 401;
        return { success: false, error: 'Invalid credentials' };
      }

      const token = await jwt.sign({
        userId: user.id,
        email: user.email,
      });

      return {
        user: { id: user.id, email: user.email },
        token,
      };
    },
    {
      body: loginSchema,
      response: {
        200: authResponseSchema,
        401: errorResponseSchema,
      },
    }
  )
  .get('/api/auth/me', async ({ jwt, headers, set }) => {
    const auth = headers.authorization;
    if (!auth) {
      set.status = 401;
      return { success: false, error: 'Unauthorized' };
    }

    const payload = await jwt.verify(auth.replace('Bearer ', ''));
    if (!payload) {
      set.status = 401;
      return { success: false, error: 'Invalid token' };
    }

    const [user] = await db.select().from(users).where(eq(users.id, (payload as any).userId));
    if (!user) {
      set.status = 404;
      return { success: false, error: 'User not found' };
    }

    return { id: user.id, email: user.email };
  })
  .get('/api/auth/github', async ({ cookie, redirect }) => {
    const state = generateState();
    const url = await github.createAuthorizationURL(state, ["user:email"]);

    cookie.oauth_state.set({
      value: state,
      path: "/",
      secure: env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 60 * 10,
      sameSite: "lax"
    });

    return redirect(url.toString());
  })
  .get('/api/auth/github/callback', async ({ query, cookie, jwt, redirect, set }) => {
    const code = query.code;
    const state = query.state;
    const storedState = cookie.oauth_state.value;

    if (!code || !state || !storedState || state !== storedState) {
      set.status = 400;
      return { success: false, error: 'Invalid state' };
    }

    try {
      const tokens = await github.validateAuthorizationCode(code as string);
      const accessToken = tokens.accessToken();

      const githubUserResponse = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      const githubUser = await githubUserResponse.json() as any;

      let email = githubUser.email;
      if (!email) {
        const emailsResponse = await fetch("https://api.github.com/user/emails", {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        const emails = await emailsResponse.json() as any[];
        const primaryEmail = emails.find((e: any) => e.primary && e.verified);
        email = primaryEmail ? primaryEmail.email : null;
      }

      if (!email) {
        set.status = 400;
        return { success: false, error: 'No verified email found' };
      }

      let user = await db.query.users.findFirst({
        where: eq(users.email, email)
      });

      if (!user) {
        const [newUser] = await db.insert(users).values({
          email: email,
        }).returning();
        user = newUser;
      }

      const existingAccount = await db.query.oauthAccounts.findFirst({
        where: and(
          eq(oauthAccounts.provider, 'github'),
          eq(oauthAccounts.providerAccountId, String(githubUser.id))
        )
      });

      if (!existingAccount) {
        await db.insert(oauthAccounts).values({
          userId: user.id,
          provider: 'github',
          providerAccountId: String(githubUser.id)
        });
      }

      const token = await jwt.sign({
        userId: user.id,
        email: user.email,
      });

      return redirect(`${env.FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (e) {
      console.error(e);
      set.status = 500;
      return { success: false, error: 'Authentication failed' };
    }
  })
  .get('/api/auth/google', async ({ cookie, redirect }) => {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const url = await google.createAuthorizationURL(state, codeVerifier, ["profile", "email"]);

    cookie.oauth_state.set({
      value: state,
      path: "/",
      secure: env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 60 * 10,
      sameSite: "lax"
    });

    cookie.oauth_code_verifier.set({
      value: codeVerifier,
      path: "/",
      secure: env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 60 * 10,
      sameSite: "lax"
    });

    return redirect(url.toString());
  })
  .get('/api/auth/google/callback', async ({ query, cookie, jwt, redirect, set }) => {
    const code = query.code;
    const state = query.state;
    const storedState = cookie.oauth_state.value;
    const codeVerifier = cookie.oauth_code_verifier.value;

    if (!code || !state || !storedState || !codeVerifier || state !== storedState) {
      set.status = 400;
      return { success: false, error: 'Invalid state or code verifier' };
    }

    try {
      const tokens = await google.validateAuthorizationCode(code as string, codeVerifier as string);
      const accessToken = tokens.accessToken();

      const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      const googleUser = await response.json() as any;

      const email = googleUser.email;

      let user = await db.query.users.findFirst({
        where: eq(users.email, email)
      });

      if (!user) {
        const [newUser] = await db.insert(users).values({
          email: email,
        }).returning();
        user = newUser;
      }

      const existingAccount = await db.query.oauthAccounts.findFirst({
        where: and(
          eq(oauthAccounts.provider, 'google'),
          eq(oauthAccounts.providerAccountId, googleUser.sub)
        )
      });

      if (!existingAccount) {
        await db.insert(oauthAccounts).values({
          userId: user.id,
          provider: 'google',
          providerAccountId: googleUser.sub
        });
      }

      const token = await jwt.sign({
        userId: user.id,
        email: user.email,
      });

      return redirect(`${env.FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (e) {
      console.error(e);
      set.status = 500;
      return { success: false, error: 'Authentication failed' };
    }
  });
