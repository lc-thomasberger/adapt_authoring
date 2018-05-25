const {App} = require('adapt-authoring-core');

async function start() {
  try {
    const app = new App();
    await app.initialise();
    await app.preloadDelegate(app);
    await app.bootDelegate(app);
  } catch(e) {
    console.log(`Failed to start app: ${e}`);
  }
}

module.exports = start();
