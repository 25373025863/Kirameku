FROM node:22-bookworm-slim

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@11.1.3 --activate
RUN chown node:node /app

COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./

USER node
RUN pnpm install --frozen-lockfile

COPY --chown=node:node . .

ARG BACKEND_URL=http://api:8080
ENV BACKEND_URL=${BACKEND_URL}
RUN pnpm build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["pnpm", "exec", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
