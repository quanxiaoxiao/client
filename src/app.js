const Koa = require('koa');
const http = require('http');
const url = require('url');
const path = require('path');
const isInDocker = require('./utils').isInDocker();
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
      filename: isInDocker ?
        '/api/logs/app.log' :
        path.resolve(__dirname, '..', 'logs/app.log'),
      pattern: '-yyyy-MM-dd',
    },
  },
  categories: { default: { appenders: ['app'], level: 'DEBUG' } },
});

const { api, middlewares = [] } = isInDocker ? require('/api/api.js') : require('./api'); // eslint-disable-line
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

app.use(router.routes()).use(router.allowedMethods());


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

server.on('upgrade', (req, socket, head) => {
  const { pathname } = url.parse(req.url);
  const upgrade = routeList.find(item =>
    item.pathname === pathname &&
    item.method === 'GET' &&
    item.handleType === 'socket');
  if (upgrade) {
    upgrade.handle(req, socket, head);
  } else {
    socket.destroy();
  }
});

process.on('uncaughtException', (error) => {
  logger.error(error);
  console.error(error);
  const killTimer = setTimeout(() => {
    process.exit(1);
  }, 3000);
  killTimer.unref();
});

