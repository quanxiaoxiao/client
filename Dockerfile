FROM quanxiaoxiao/node:1

RUN mkdir /server /api

WORKDIR /server

COPY package.json .

RUN npm install

COPY . .
COPY src/api.js /api/api.js

EXPOSE 3000

CMD ["npm", "start"]
