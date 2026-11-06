FROM node:22-slim AS build
ARG PNPM_VERSION=12.16.1
RUN npm i -g pnpm@${PNPM_VERSION}
WORKDIR /repo

COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/
COPY apps/server/package.json apps/server/
RUN pnpm install --frozen-lockfile --filter web...

COPY apps/web apps/web
RUN pnpm --filter web build

FROM nginx:1.27-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 80

