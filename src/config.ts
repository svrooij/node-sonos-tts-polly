import * as yargs from "yargs";

export interface IConfigOptions {
  port: number;
  amazonKey?: string;
  amazonSecret?: string;
  amazonRegion: string;
  cacheFolder: string;
  cacheUri?: string;
  allowGet: boolean;
  logRequests: boolean;
  runningInContainer: boolean;
}

export class ConfigLoader {
  public static pkg: {[x: string]: unknown} = require("../package.json");
  public static loadConfig(): IConfigOptions {
    const config = yargs
      .usage(`${ConfigLoader.pkg.name} ${ConfigLoader.pkg.version}\n\nUsage: sonos-tts-polly [options]`)
      .options({
        port: { type: "number", default: 5601, describe: "The port the webserver will run" },
        amazonKey: { type: "string", demandOption: true,
          describe: "Amazon key id with access to polly" },
        amazonSecret: { type: "string", demandOption: true,
          describe: "Amazon secret access token with access to polly" },
        amazonRegion: { type: "string", demandOption: true, default: "eu-west-1",
          describe: "Amazon region that should be used." },
        cacheFolder: { type: "string", demandOption: true, default: "./.cache",
          describe: "Folder to save the speech files" },
        cacheUri: { type: "string", demandOption: false,
          describe: "Specify if the cache folder is also accesible from a different url, like a cdn" },
        allowGet: { type: "boolean", default: false,
          describe: "Enables the /api/:lang/:text endpoint" },
        logRequests: { type: "boolean", default: false,
          describe: "Will log all requests to console" },
        runningInContainer: { type: "boolean", default: false,
          describe: "Will teel the app to trust the reverse proxy." }

      })
      .epilog("Options can also be set with environment variables prefixed with 'SONOS_TTS_'")
      .env("SONOS_TTS")
      .version()
      .showHelpOnFail(true, "Specify at least the required parameters")
      .help("help");
    return config.argv as unknown as IConfigOptions;
  }
}
