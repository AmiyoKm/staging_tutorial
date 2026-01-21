FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock* /temp/dev/
RUN cd /temp/dev && bun install
RUN cd /temp/dev && bun pm bin > /tmp/bunpm
RUN mv /temp/dev/node_modules /temp/dev/package.json /temp/dev/bun.lock* /app/

FROM base AS release
COPY --from=install /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV production
EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
