FROM quanxiaoxiao/node:1

RUN mkdir /app /api

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

ENV PORT=3000

EXPOSE $PORT

CMD ["npm", "start"]
