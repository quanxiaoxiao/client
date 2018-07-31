FROM quanxiaoxiao/node:1

RUN mkdir /app /api


WORKDIR /app

COPY package.json .

RUN npm install

COPY . .
COPY src/api.js /api/api.js

RUN chmod -R a+rwx /app /api

EXPOSE 3000

CMD ["npm", "start"]
