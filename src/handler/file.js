const fp = require('lodash/fp');
const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const getFilePath = require('../utils/getFilePath');

const handlerMap = {
  string: pathname => (ctx) => {
    ctx.type = path.extname(pathname);
    ctx.body = fs.createReadStream(getFilePath(pathname));
  },
  array: arr => async (ctx) => {
    const [first, ...other] = arr;
    let pathname;
    if (_.isString(first)) {
      pathname = first;
    } else {
      pathname = await first(ctx);
    }
    if (!_.isString(pathname)) {
      ctx.trhow(500);
    }
    ctx.type = path.extname(pathname);
    ctx.body = fp.compose(...other.reverse())(fs.readFileSync(getFilePath(pathname)));
  },
  function: fn => async (ctx) => {
    const pathname = await fn(ctx);
    if (!_.isString(pathname)) {
      ctx.trhow(500);
    }
    ctx.type = path.extname(pathname);
    ctx.body = fs.createReadStream(getFilePath(pathname));
  },
};

const file = (obj) => {
  if (obj == null) {
    return (ctx) => {
      ctx.throw(404);
    };
  }
  const handlerName = Array.isArray(obj) ? 'array' : typeof obj;
  const handler = handlerMap[handlerName];
  if (!handler) {
    return (ctx) => {
      ctx.throw(404);
    };
  }
  return handler(obj);
};

module.exports = file;
