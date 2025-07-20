FROM node:18-alpine

WORKDIR /app

# copy package files
COPY package*.json ./

# install dependencies
RUN npm ci --only=production

# copy source code
COPY . .

# build TypeScript
RUN npm run build

# expose port
EXPOSE 8088

# create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S blockchain -u 1001

# change ownership of the app directory
RUN chown -R blockchain:nodejs /app
USER blockchain

# start the application
CMD ["npm", "start"]
