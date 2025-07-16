FROM node:18-alpine

WORKDIR /src

COPY ./package.json .

RUN npm install

RUN npm i -g serve

COPY . .

# Simona - added this line for environment variables
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

RUN npm run build

EXPOSE 3000

CMD [ "serve", "-s", "dist" ]