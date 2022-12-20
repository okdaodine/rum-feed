let Joi = require('joi');
const httpStatus = require('http-status');
const Errors = require('./errors');

// Usage：
// Validator.attempt(task, {
//   name: Joi.string().required(),
//   description: Joi.string().required(),
// });
const attempt = (value, schema, status = httpStatus.BAD_REQUEST) => {
  const ret = Joi.validate(
    value,
    Joi.object()
    .required()
    .keys(schema), {
      abortEarly: false
    }
  );
  if (ret.error) {
    const errors = {};
    for (const item of ret.error.details) {
      errors[item.path.join('.')] = item.message;
    }
    throw Object.assign(new Error(), {
      code: Errors.ERR_FIELDS_INVALID,
      message: JSON.stringify(errors),
      status
    });
  }
  return ret.value;
};

// Usage：
// Validator.throws(Errors.ERR_BALANCE_NOT_ENOUGH);
const throws = (code, status = httpStatus.BAD_REQUEST) => {
  let err = {
    code,
    status
  };
  if (typeof code === 'object') {
    err = {
      code: code.code,
      message: code.message,
      status
    };
  }
  throw Object.assign(new Error(), err);
};

// Usage：
// Validator.assert(task, Errors.ERR_NOT_FOUND('Task'));
// Validator.assert(!isApproved, Errors.ERR_TASK_HAS_BEEN_APPROVED);
const assert = (
  value,
  code,
  status = httpStatus.BAD_REQUEST
) => {
  if (!value) {
    throws(code, status);
  }
};

const assertFault = (value, message) => {
  if (!value) {
    const err = {
      message,
      status: httpStatus.INTERNAL_SERVER_ERROR
    };
    throw Object.assign(new Error(), err);
  }
};

module.exports = {
  attempt,
  throws,
  assert,
  assertFault,
  httpStatus,

  Joi,
  Errors
};
