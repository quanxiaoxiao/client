module.exports = {
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

    '/sunlandapi/*': {
      proxy: 'http://localhost:3003',
    },

    '/sunland/*': {
      proxy: 'http://localhost:3003',
    },

    '/static/*': {
      proxy: 'http://localhost:3003',
    },
    '/test': {
      proxy: 'http://localhost:3003',
    },
  },
};
