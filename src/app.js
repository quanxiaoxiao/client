const Koa = require('koa');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const url = require('url');
const cors = require('@koa/cors');
const compress = require('koa-compress');
const conditional = require('koa-conditional-get');
const etag = require('koa-etag');
const config = require('../api/config');

const { api, middlewares = [] } = require('../api/api.js');
const apiParser = require('./apiParser');

const app = new Koa();

app.use(compress());
app.use(conditional());
app.use(etag());
app.use(cors());


middlewares.forEach((middleware) => {
  app.use(middleware);
});

const routeList = apiParser(api);

console.log('---------routerList---------');
console.log(routeList.map(item => `${item.method} ${item.pathname} ${item.handlerName}`).join('\n'));
console.log('---------routerList---------');

app.use(async (ctx, next) => {
  const routerItem = routeList.find(item => item.method === ctx.method
    && item.handlerName !== 'wsProxy'
    && item.regexp.exec(ctx.path));
  if (!routerItem) {
    ctx.throw(404);
  }
  ctx.matchs = routerItem.regexp.exec(ctx.path);
  await routerItem.handler(ctx, next);
});

const server = (config.cert ? https : http).createServer({
  ...config.cert ? {
    key: config.key,
    cert: config.cert,
  } : {},
}, app.callback())
  .listen(config.port, () => {
    console.log(`server listen at port: ${config.port}`);
  });

server.on('error', (error) => {
  console.error(error);
});

server.on('upgrade', (req, socket) => {
  const { pathname } = url.parse(req.url);
  const upgrade = routeList.find(item => item.handlerName === 'wsProxy'
    && item.method === 'GET'
    && item.regexp.exec(pathname));
  if (upgrade) {
    console.log('websocket connection:', socket.remoteAddress);
    upgrade.handler(req, socket, server);
  } else {
    console.log('websocket deny:', socket.remoteAddress);
    socket.destroy();
  }
});

process.on('uncaughtException', (error) => {
  console.error(error);
  fs.writeFileSync(path.resolve(__dirname, '..', `error-${Date.now()}`), error.message);
  const killTimer = setTimeout(() => {
    process.exit(1);
  }, 3000);
  killTimer.unref();
});
