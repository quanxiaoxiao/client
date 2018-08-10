const path = require('path');

module.exports = {
  middlewares: [],
  api: {
    '/quan': {
      body: { name: 'quan' },
    },
    '/test': {
      file: path.resolve(__dirname, '..', 'static/test.json'),
    },
    '/rice': {
      all: {
        body: { name: 'rice' },
      },
    },
    '/ws': {
      socket: (ws) => {
        ws.send('sdfsdfdf');
      },
    },
  },
};
