const httpStatus = require('http-status');
const config = require('../config');
const { assert, Errors } = require('../utils/validator');

exports.errorHandler = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    if (![400, 401, 404].includes(err.status)) {
      console.log(err);
    }
    console.log(err);
    if (
      err.status &&
      err.status >= httpStatus.BAD_REQUEST &&
      err.status < httpStatus.INTERNAL_SERVER_ERROR
    ) {
      ctx.throws(err);
      return;
    }
    throw err;
  }
};

exports.extendCtx = async (ctx, next) => {
  ctx.ok = data => {
    ctx.body = data;
  };
  ctx.er = (error, code) => {
    ctx.status = code || 400;
    ctx.body = error;
  };
  ctx.throws = (err) => {
    const code = err.code;
    if (code === 'ERR_NOT_FOUND') {
      ctx.status = httpStatus.NOT_FOUND;
    } else if (code === 'ERR_TOO_MANY_REQUEST') {
      ctx.status = httpStatus.TOO_MANY_REQUESTS;
    } else {
      ctx.status = err.status || httpStatus.BAD_REQUEST;
    }
    ctx.body = {
      code,
      message: err.message
    };
  };
  await next();
};

exports.ensurePermission = async (ctx, next) => {
  if (config.admins && config.admins.length > 0) {
    assert(config.admins.includes(ctx.headers['x-address']), Errors.ERR_NO_PERMISSION('this api'))
  }
  await next();
}