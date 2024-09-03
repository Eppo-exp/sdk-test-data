FROM node:18

WORKDIR /app

COPY package*.json ./

RUN yarn install

COPY . .

RUN yarn clone-test-data
RUN yarn build

ENV EPPO_SDK_TEST_SERVER_PORT=5000
ENV EPPO_TEST_DATA_ROOT="./test-data"

EXPOSE 5000

CMD ["yarn", "start:prod"]
