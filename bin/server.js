const { App } = require('adapt-authoring-core');

async function server() {
  console.log(`Running 'server' from ${process.cwd()}`);
  const app = new App();
  try {
    await app.initialise();
    await app.preload();
    await app.boot();
  } catch(e) {
    console.error(`Failed to boot app, ${e}`);
  }
}

module.exports = server();
