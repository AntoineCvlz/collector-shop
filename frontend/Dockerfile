# ── Stage 0 : Dev (Vite hot-reload) ───────────────────────────────
# Utilisé en local par docker-compose (cible "dev"). Non utilisé par la CI,
# qui build l'image complète et prend le dernier stage (prod nginx).
FROM node:20-alpine AS dev

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host"]

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
RUN apk update && apk upgrade --no-cache libpng zlib libxml2 && rm -rf /var/cache/apk/*

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Allow nginx to run as non-root on port 8080
RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/log/nginx \
    && chown -R nginx:nginx /etc/nginx/conf.d \
    && touch /var/run/nginx.pid \
    && chown nginx:nginx /var/run/nginx.pid \
    && sed -i '/^user /d' /etc/nginx/nginx.conf

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:8080 || exit 1

USER nginx

CMD ["nginx", "-g", "daemon off;"]