FROM node:22

WORKDIR /app

COPY package*.json ./

RUN yarn install

COPY . .

RUN yarn build

EXPOSE $EPPO_API_PORT

HEALTHCHECK CMD curl --fail http://localhost:${EPPO_API_PORT} || exit 1

CMD ["yarn", "start:prod"]
