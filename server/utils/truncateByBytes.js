module.exports = (str, length) => {
  let ret = '';
  for (const c of str.split('')) {
    ret += c;
    if (getBytes(ret) >= length) {
      break;
    }
  }
  return ret;
}

function getBytes(str) {
  str = str.replace(/[^\x00-\xff]/g, '**');
  return str.length;
}