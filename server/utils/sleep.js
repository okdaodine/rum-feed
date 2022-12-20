module.exports = (n = 500) =>
  new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, n);
  });