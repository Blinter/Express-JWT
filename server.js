/** Server startup for Message.ly. */
const setupApp = require("./app");
const net = require('net');

function getAvailablePort(startPort = 3000) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once('error', (err) => {
      server.close();
      if (err.code === 'EADDRINUSE') {
        resolve(getAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });

    server.once('listening', () => {
      const port = server.address().port;
      server.close();
      resolve(port);
    });

    server.listen(startPort);
  });
}
let app;
(async () => {
  try {
    app = await setupApp();
    const newPort = await getAvailablePort();
    app.listen(newPort, function () {
      console.log("Listening on", newPort);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
})();