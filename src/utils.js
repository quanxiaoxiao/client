const path = require('path');

exports.getFilePath = pathname => path.resolve(__dirname, '..', pathname);
