const fs = require('fs');
const config = require('./config');

(async () => {
  if (process.env.NODE_ENV === 'production' && config.staticCDN) {
    try {
      useStaticCDN(config.staticCDN);
    } catch (err) {
      console.log(err);
    }
  }
})();

async function useStaticCDN(cdn) {
  try {
    console.log(`[useStaticCDN]:`, { cdn });
    let html = await fs.promises.readFile('./build/index.html', 'utf-8');
    html = html.replace('"/static/js', `"${config.staticCDN}`);
    html = html.replace('"/static/css', `"${config.staticCDN}`);
    await fs.promises.writeFile('./build/index.html', html);
  } catch (e) {
    console.log(e);
  }
}