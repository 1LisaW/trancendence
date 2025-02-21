FROM node:18-alpine

WORKDIR /src

COPY ./configuration.json .

COPY ./package*.json .

RUN npm ci

# RUN npm i -g serve

COPY . .

RUN npm run build

EXPOSE 8081

CMD [ "npm", "run", "start" ]
