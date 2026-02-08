import { Google, GitHub } from "arctic";
import { env } from "./env";

export const google = new Google(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  `${env.API_URL}/api/auth/google/callback`
);

export const github = new GitHub(
  env.GITHUB_CLIENT_ID,
  env.GITHUB_CLIENT_SECRET,
  `${env.API_URL}/api/auth/github/callback`
);
