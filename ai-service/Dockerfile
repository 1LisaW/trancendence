FROM node:18-alpine

WORKDIR /src

COPY ./configuration.json .

COPY ./package*.json .

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 8086

CMD [ "npm", "run", "start" ]
