const { PassThrough } = require('stream');
const log4js = require('log4js');
const http = require('http');

const logger = log4js.getLogger('http-proxy');

module.exports = (ctx, options, emitError, setOutgoing = true) => {
  if (!options || !options.hostname) {
    ctx.throw(404);
  }
  logger.info(JSON.stringify(options));
  const passThrough = new PassThrough();
  const { req } = ctx;
  const proxyReq = http.request(options);

  let proxyRes;

  req.pipe(proxyReq)
    .on('response', (res) => {
      proxyRes = res;
      if (!ctx.res.finished) {
        if (setOutgoing) {
          ctx.status = proxyRes.statusCode;
          ctx.set(proxyRes.headers);
        }
        proxyRes.pipe(passThrough);
      }
      proxyRes.on('error', (error) => {
        logger.error('proxyRes', error);
        if (!ctx.res.finished) {
          passThrough.end();
        }
      });
    })
    .on('error', (error) => {
      logger.error('proxyReq', error);
      if (proxyRes) {
        proxyRes.unpipe(passThrough);
      }
      if (emitError) {
        passThrough.emit('error', error);
      } else if (!ctx.res.finished) {
        ctx.status = 500;
        passThrough.end();
      }
    });

  req.on('error', () => {
    proxyReq.abort();
  });

  req.on('aborted', () => {
    proxyReq.abort();
  });
  return passThrough;
};
