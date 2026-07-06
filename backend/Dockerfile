FROM php:8.4-fpm-alpine

# Librairies runtime nécessaires aux extensions PHP compilées ci-dessous.
# Les headers de dev (-dev) sont installés en virtual package puis supprimés :
# ils ne servent qu'à la compilation, pas à l'exécution.
RUN apk add --no-cache \
    libpq \
    libzip \
    oniguruma \
    icu-libs \
    fcgi

RUN apk add --no-cache --virtual .build-deps \
        $PHPIZE_DEPS \
        libpq-dev \
        libzip-dev \
        oniguruma-dev \
        icu-dev \
    && docker-php-ext-install \
        pdo \
        pdo_pgsql \
        pgsql \
        bcmath \
        intl \
        opcache \
        zip \
    # APCu : stockage en mémoire partagée des métriques Prometheus (cf. /metrics).
    # Activé aussi en CLI pour que les commandes artisan puissent y accéder.
    && pecl install apcu \
    && docker-php-ext-enable apcu \
    && { \
        echo 'apc.enabled=1'; \
        echo 'apc.enable_cli=1'; \
    } > /usr/local/etc/php/conf.d/apcu.ini \
    && apk del .build-deps

WORKDIR /var/www/html

# ← Copie du code source
COPY --chown=www-data:www-data . .

# ← Installation des dépendances composer.
# composer et git ne servent qu'au build : installés puis retirés de l'image finale.
RUN apk add --no-cache --virtual .composer-deps git unzip \
    && curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
    && composer install --no-dev --optimize-autoloader --no-interaction \
    && rm /usr/local/bin/composer \
    && apk del .composer-deps

RUN mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 775 storage bootstrap/cache

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD SCRIPT_NAME=/ping SCRIPT_FILENAME=/ping REQUEST_METHOD=GET cgi-fcgi -bind -connect 127.0.0.1:9000 || exit 1

USER www-data

EXPOSE 9000

CMD ["php-fpm"]
