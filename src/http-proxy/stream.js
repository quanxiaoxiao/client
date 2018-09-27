const { PassThrough } = require('stream');
const log4js = require('log4js');
const http = require('http');

const logger = log4js.getLogger('app');

module.exports = (ctx, options, emitError, setOutgoing = true) => {
  const passThrough = new PassThrough();
  if (!options || !options.hostname) {
    ctx.throw(404);
  }
  logger.info(`proxy: ${JSON.stringify(options)}`);
  const { req } = ctx;
  const proxyReq = http.request(options);

  let proxyRes;

  req.pipe(proxyReq)
    .once('response', (res) => {
      proxyRes = res;
      if (!ctx.res.finished) {
        if (setOutgoing) {
          ctx.status = proxyRes.statusCode;
          ctx.set(proxyRes.headers);
        }
        proxyRes.pipe(passThrough);
      }
    })
    .once('error', (error) => {
      if (proxyRes) {
        proxyRes.unpipe(passThrough);
      }
      if (emitError) {
        passThrough.emit('error', error);
      } else if (!ctx.res.finished) {
        logger.error(error);
        ctx.status = 500;
        passThrough.end();
      }
    });

  req.once('error', () => {
    proxyReq.abort();
  });

  req.once('aborted', () => {
    proxyReq.abort();
  });
  return passThrough;
};
