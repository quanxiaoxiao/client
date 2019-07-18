const Koa = require('koa');
const path = require('path');
const fs = require('fs');
const http = require('http');
const url = require('url');
const Router = require('koa-router');
const pathToRegexp = require('path-to-regexp');
const cors = require('@koa/cors');
const compress = require('koa-compress');
const conditional = require('koa-conditional-get');
const etag = require('koa-etag');
const log4js = require('log4js');

log4js.configure({
  appenders: {
    app: {
      type: 'dateFile',
      filename: path.resolve(__dirname, '..', 'logs', 'app.log'),
      pattern: '-yyyy-MM-dd',
    },
  },
  categories: { default: { appenders: ['app'], level: 'DEBUG' } },
});

const { api, middlewares = [] } = require('../api/api.js');
const apiParser = require('./apiParser');

const logger = log4js.getLogger('app');

const port = process.env.PORT || 3000;

const app = new Koa();
const router = new Router();

app.use(require('./middlewares/logger'));

app.use(compress());
app.use(conditional());
app.use(etag());
app.use(cors());


middlewares.forEach((middleware) => {
  app.use(middleware);
});

app.use(router.routes());
app.use(router.allowedMethods());

const routeList = apiParser(api);

logger.info('---------routerList start---------');
logger.info(routeList);
logger.info('---------routerList end---------');

routeList
  .filter(item => item.handlerName !== 'wsProxy')
  .forEach(({ method, pathname, handler }) => {
    router[method.toLowerCase()](pathname, handler);
  });

const server = http.createServer(app.callback())
  .listen(port, () => {
    console.log(`server listen at port: ${port}`);
    logger.info(`listen at port: ${port}`);
  });

server.on('error', (error) => {
  logger.error(error);
});

server.on('upgrade', (req, socket) => {
  const { pathname } = url.parse(req.url);
  const upgrade = routeList.find(item => pathToRegexp(item.pathname).test(pathname)
    && item.method === 'GET'
    && item.handlerName === 'wsProxy');
  if (upgrade) {
    logger.info('socket connection:', socket.remoteAddress);
    upgrade.handler(req, socket, server);
  } else {
    logger.info('socket destory:', socket.remoteAddress);
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
