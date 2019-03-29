FROM node:10-alpine

WORKDIR /app

COPY package.json .
COPY npm.taobao.sh .

RUN ./npm.taobao.sh

RUN npm install --production

COPY . .

ENV PORT=3000

EXPOSE $PORT

CMD ["npm", "start"]
