const moment = require('moment');

module.exports = date => {
  const diffHours = Math.abs(moment(date).diff(Date.now(), 'hours'));
  return diffHours <= 24;
}