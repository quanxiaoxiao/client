FROM node:10-alpine

WORKDIR /app

COPY package.json .

RUN npm install --production

COPY . .

ENV PORT=3000

EXPOSE $PORT

CMD ["npm", "start"]
