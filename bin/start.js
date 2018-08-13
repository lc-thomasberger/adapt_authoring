const {App} = require('adapt-authoring-core');

async function start() {
  console.log(`Running application from ${process.cwd()}`);
  const app = new App();
  try {
    await app.preloadDelegate(app);
    app.emit('app:modulesPreloaded');

    await app.bootDelegate(app);
    app.emit('app:modulesBooted');
  } catch(e) {
    console.log(`Failed to start application: ${e}`);
  }
}

module.exports = start();
