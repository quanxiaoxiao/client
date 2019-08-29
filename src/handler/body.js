const httpForward = require('../httpForward');
const fetch = require('../fetch');

const body = handle => async (ctx) => {
  if (typeof handle === 'function') {
    try {
      const data = await handle(
        ctx,
        httpForward,
        options => fetch({
          ...options,
          socket: ctx.req.socket,
        }),
      );
      ctx.body = data;
    } catch (error) {
      console.log(error);
      ctx.throw(500);
    }
  } else {
    ctx.body = handle;
  }
};

module.exports = body;
