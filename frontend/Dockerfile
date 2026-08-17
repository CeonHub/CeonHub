# --- dependencies -----------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# --- build ------------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are inlined into the browser bundle at build time, so they
# must be supplied as build arguments rather than at container start.
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

RUN npm run build

# --- runtime ----------------------------------------------------------------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# next.config.ts sets output: "standalone", which emits a minimal server bundle.
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

USER node
EXPOSE 3000
CMD ["node", "server.js"]
