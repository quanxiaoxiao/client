module.exports = {
  middlewares: [],
  api: {
    '/name': {
      body: {
        name: 'quan',
      },
    },
    '/quan': {
      body: (ctx) => {
        ctx.throw(401);
      },
    },

    '/aa/(.*)': {
      body: () => ({
        name: 'aaa',
      }),
    },
  },
};
