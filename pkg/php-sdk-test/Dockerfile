FROM php:8.1

RUN apt-get update && \
    apt-get install -y git

COPY . .
COPY --chmod=755 build.sh /

EXPOSE 4000

CMD ["/build.sh"]