const path = require('path');
const fs = require('fs');

exports.getFilePath = pathname => path.resolve(__dirname, '..', pathname);

exports.isInDocker = () => {
  try {
    fs.statSync('/.dockerenv');
    return true;
  } catch (e) {
    return false;
  }
};
