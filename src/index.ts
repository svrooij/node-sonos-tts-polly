import { ConfigLoader } from './config';
import PollyTTSServer from './server';

// Loading the config should crash if values are incorrect
const config = ConfigLoader.loadConfig();

// Create (and start) server with the config values.
const server = new PollyTTSServer(config);

// This is needed to gracefully shutdown inside docker, see https://github.com/nodejs/node/issues/4182
process.on('SIGINT', () => {
  console.log('Got [CTRL]+C signal, closing...');
  server.stop();
  process.exit();
});
