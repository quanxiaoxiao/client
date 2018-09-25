const Koa = require('koa');
const http = require('http');
const url = require('url');
const Router = require('koa-router');
const cors = require('@koa/cors');
const compress = require('koa-compress');
const conditional = require('koa-conditional-get');
const etag = require('koa-etag');
const log4js = require('log4js');

log4js.configure({
  appenders: {
    app: {
      type: 'dateFile',
      filename: '/api/logs/app.log',
      pattern: '-yyyy-MM-dd',
    },
  },
  categories: { default: { appenders: ['app'], level: 'DEBUG' } },
});

const { api, middlewares = [] } = require('/api/api.js');
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

logger.info('routerList', routeList);

routeList
  .filter(item => item.handleType !== 'socket')
  .forEach(({ method, pathname, handle }) => {
    router[method.toLowerCase()](pathname, handle);
  });

const server = http.createServer(app.callback()).listen(port, () => {
  console.log(`server listen at port: ${port}`);
  logger.info(`listen at port: ${port}`);
});

server.on('error', (error) => {
  logger.error(error);
});

server.on('upgrade', (req, socket) => {
  const { pathname } = url.parse(req.url);
  const upgrade = routeList.find(item => item.pathname === pathname
    && item.method === 'GET'
    && item.handleType === 'wsProxy');
  if (upgrade) {
    logger.info('socket connection:', socket.remoteAddress);
    upgrade.handle(req, socket, server);
  } else {
    logger.info('socket destory:', socket.remoteAddress);
    socket.destroy();
  }
});

process.on('uncaughtException', (error) => {
  console.error(error);
  logger.fatal(error);
  const killTimer = setTimeout(() => {
    process.exit(1);
  }, 3000);
  killTimer.unref();
});
