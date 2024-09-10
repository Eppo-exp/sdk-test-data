FROM php:8.1

# dependencies needed for composer (and for build.sh).
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip


COPY --from=composer /usr/bin/composer /usr/bin/composer

WORKDIR /relayapp

COPY . .

COPY --chmod=755 build.sh /

RUN composer install

EXPOSE 4000

CMD ["/build.sh"]