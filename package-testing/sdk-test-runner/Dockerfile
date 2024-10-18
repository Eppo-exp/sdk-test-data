FROM node:18-alpine

WORKDIR /app

COPY package*.json  ./

RUN yarn install

COPY . .

RUN yarn build

ENV EPPO_API_HOST=host.docker.internal
ENV SDK_RELAY_HOST=host.docker.internal

CMD ["yarn", "start"]