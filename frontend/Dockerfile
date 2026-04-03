# ── Stage 1 : Build Vite ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2 : Serve avec Nginx ────────────────────────────────────
FROM nginx:alpine

# Refresh Alpine packages to pull latest security fixes in base image layers.
RUN apk update && apk upgrade --no-cache libpng zlib && rm -rf /var/cache/apk/*

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]