# --- build ------------------------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .
# `npm run build` runs `prisma generate` first, then tsc.
RUN npm run build

# --- runtime ----------------------------------------------------------------
FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

# The Prisma CLI stays in "dependencies" so `npm run db:deploy` (migrations) can
# run inside the container or as a platform release command. Seeding uses the
# compiled script: `npm run db:seed:prod`.
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY --from=build /app/dist ./dist

# Local storage driver writes here; mount a volume to keep uploads across restarts.
RUN mkdir -p storage && chown -R node:node storage
USER node

EXPOSE 4000
CMD ["node", "dist/server.js"]
