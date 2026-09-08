FROM node:22-bookworm-slim AS deps
RUN npm install -g pnpm@10
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:22-bookworm-slim
RUN npm install -g pnpm@10
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
RUN NODE_OPTIONS=--max-old-space-size=2560 pnpm build \
    && rm -rf .next/standalone/.next/static .next/standalone/public \
    && cp -r .next/static .next/standalone/.next/static \
    && cp -r public .next/standalone/public
EXPOSE 3020
ENV PORT=3020 \
    HOSTNAME=0.0.0.0
CMD ["node", ".next/standalone/server.js"]
