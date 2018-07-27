const Koa = require('koa');
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

const { api, middlewares = [] } = require('/api/api.js'); // eslint-disable-line
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

routeList.forEach(({ method, pathname, handle }) => {
  router[method.toLowerCase()](pathname, handle);
});

app.listen(port, () => {
  logger.info(`listen at port: ${port}`);
});


process.on('uncaughtException', (error) => {
  logger.error(error);
  const killTimer = setTimeout(() => {
    process.exit(1);
  }, 3000);
  killTimer.unref();
});
