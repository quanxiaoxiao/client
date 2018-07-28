const request = require('request');
const fp = require('lodash/fp');
const log4js = require('log4js');
const _ = require('lodash');

const logger = log4js.getLogger('app');

const apiRequest = (options, req) =>
  new Promise((resolve, reject) => {
    req.pipe(request(options, (error, res, body) => {
      if (error) {
        reject(error);
      } else {
        resolve(body);
      }
    }));
  });

const mapType = {
  string: host => (ctx) => {
    const proxy = request({
      url: `${host}${ctx.path}?${ctx.querystring}`,
      method: ctx.method.toLowerCase(),
    });
    proxy.on('response', ({ headers, statusCode }) => {
      ctx.status = statusCode;
      ctx.set(headers);
    });
    proxy.on('error', (error) => {
      logger.error('proxy handle', error);
    });
    ctx.body = ctx.req.pipe(proxy);
  },
  array: arr => async (ctx) => {
    const [first, ...other] = arr;
    let options = {
      method: ctx.method.toLowerCase(),
    };
    if (_.isString(first)) {
      options.url = `${first}${ctx.path}?${ctx.querystring}`;
    } else if (_.isFunction(first)) {
      const result = await first(ctx);
      options = {
        ...options,
        ..._.isString(result) ? {
          url: result,
        } : result,
      };
    } else if (_.isPlainObject(first)) {
      options = {
        ...options,
        ...first,
      };
    }
    const body = await apiRequest(options, ctx.req);
    ctx.body = fp.compose(...other.reverse())(body, ctx);
  },
  function: fn => async (ctx) => {
    const result = await fn(ctx);
    const options = {
      method: ctx.method.toLowerCase(),
      ..._.isString(result) ? {
        url: result,
      } : result,
    };
    const proxy = request(options);
    proxy.on('response', ({ headers, statusCode }) => {
      ctx.status = statusCode;
      ctx.set(headers);
    });
    proxy.on('error', (error) => {
      logger.error('proxy handle', error);
    });
    ctx.body = ctx.req.pipe(proxy);
  },
  object: options => (ctx) => {
    const proxy = request(options);
    proxy.on('response', ({ headers, statusCode }) => {
      ctx.status = statusCode;
      ctx.set(headers);
    });
    proxy.on('error', (error) => {
      logger.error('proxy handle', error);
    });
    ctx.body = ctx.req.pipe(proxy);
  },
};

const proxy = (obj) => {
  if (obj == null) {
    return obj;
  }
  const type = Array.isArray(obj) ? 'array' : typeof obj;
  return mapType[type] && mapType[type](obj);
};

module.exports = proxy;