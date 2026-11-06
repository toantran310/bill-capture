FROM node:22-slim
# Đặt đúng phiên bản pnpm đang dùng ở máy bạn (chạy: pnpm -v)
ARG PNPM_VERSION=12.16.1
RUN npm i -g pnpm@${PNPM_VERSION}
WORKDIR /repo

# Lớp cài dependency: chỉ build lại khi package.json / lockfile đổi
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter server...

COPY apps/server apps/server
RUN pnpm --filter server build

ENV NODE_ENV=production
EXPOSE 9100
CMD ["node", "apps/server/dist/index.js"]

