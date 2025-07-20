FROM node:18-alpine

WORKDIR /src

COPY ./package*.json .

RUN npm ci

# RUN npm i -g serve

COPY . .

RUN npm run build

EXPOSE 8082

CMD [ "npm", "run", "start" ]
