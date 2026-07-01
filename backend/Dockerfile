FROM php:8.4-fpm-alpine

RUN apk add --no-cache \
    libpq-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    curl \
    oniguruma-dev \
    icu-dev

RUN docker-php-ext-install \
    pdo \
    pdo_pgsql \
    pgsql \
    bcmath \
    intl \
    opcache \
    zip

# APCu : stockage en mémoire partagée des métriques Prometheus (cf. /metrics).
# Activé aussi en CLI pour que les commandes artisan puissent y accéder.
RUN apk add --no-cache --virtual .build-apcu $PHPIZE_DEPS \
    && pecl install apcu \
    && docker-php-ext-enable apcu \
    && apk del .build-apcu \
    && { \
        echo 'apc.enabled=1'; \
        echo 'apc.enable_cli=1'; \
    } > /usr/local/etc/php/conf.d/apcu.ini

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# ← Copie du code source
COPY --chown=www-data:www-data . .

# ← Installation des dépendances composer
RUN composer install --no-dev --optimize-autoloader --no-interaction

RUN mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 775 storage bootstrap/cache

RUN apk add --no-cache fcgi

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD SCRIPT_NAME=/ping SCRIPT_FILENAME=/ping REQUEST_METHOD=GET cgi-fcgi -bind -connect 127.0.0.1:9000 || exit 1

USER www-data

EXPOSE 9000

CMD ["php-fpm"]