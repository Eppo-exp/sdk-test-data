FROM php:8.1

# dependencies needed for composer (and for build-and-run.sh).
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

COPY --chmod=755 build-and-run.sh /

RUN composer install

ENV SDK_RELAY_HOST=0.0.0.0
ENV EPPO_API_HOST=host.docker.internal

EXPOSE $SDK_RELAY_PORT

HEALTHCHECK CMD curl --fail http://localhost:${SDK_RELAY_PORT} || exit 1


CMD ["/build-and-run.sh"]
