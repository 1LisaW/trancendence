FROM node:18-alpine

WORKDIR /src

COPY ./package*.json .

RUN npm ci

RUN mkdir -p db && chmod -R 0777 db
# RUN npm i -g serve

COPY . .

RUN npm run build

EXPOSE 8085

CMD [ "npm", "run", "start" ]
