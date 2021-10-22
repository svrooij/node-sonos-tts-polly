# Text to speech server (for sonos)

[![Support me on Github][badge_sponsor]][link_sponsor]
[![github issues][badge_issues]][link_issues]
[![docker pulls][badge_docker]][link_docker]
[![npm][badge_npm]][link_npm]
[![License](https://img.shields.io/npm/l/@svrooij/sonos-tts-polly.svg?style=flat-square)](https://github.com/svrooij/node-sonos-tts-polly/blob/master/package.json)

[![Sonos typescript][badge_sonos-typescript]][link_sonos-typescript]
[![Sonos2mqtt][badge_sonos-mqtt]][link_sonos-mqtt]
[![Sonos api documentation][badge_sonos-docs]][link_sonos-docs]
[![Sonos cli][badge_sonos-cli]][link_sonos-cli]

This is a small webserver that downloads text-to-speech files from [Amazon Polly](https://aws.amazon.com/polly/) for the requested text and language. It is build as an optional extension of [node-sonos-ts](https://github.com/svrooij/node-sonos-ts) to support text-to-speech on your sonos system.

## Sponsors get access to hosted version

A hosted version of this text-to-speech server is available for my [sponsors](link_sponsors), send me a message about it.

## API

- **GET** `http://your_ip:5601/api/voices` -> Show all voices supported by Amazon at this moment.
- **GET** `http://your_ip:5601/api/:lang/:text` (if enabled in config) -> Download TTS file, and return location. (The files are cached indefinitely)
- **POST** `http://your_ip:5601/api/generate` -> will do the same as the get request but no hard url text encoding.

```TypeScript
import fetch from 'node-fetch'
import { Request } from 'node-fetch'

const request = new Request(
  'http://your_ip:5601/api/generate',
  {
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify({ text: 'Hello world', lang: 'en-US', gender: 'male', engine: 'neural' })
  }
)

fetch(request)
  .then(response => {
    if (response.ok) {
      return response.text()
    } else {
      throw new Error(`Http status ${response.status} (${response.statusText})`)
    }
  })
  .then(JSON.parse)
  .then(resp => {
    console.log(resp)
  })
```

This will return the following, depending on if you have set the `cacheUri` the `cdnUri` will be shown.

```JSON
{
  "cdnUri": "https://cacheUri/en-US/4b6eddb411d4cec3933528bfca05341828ca7593.mp3",
  "uri": "http://your_ip:5601/cache/en-US/4b6eddb411d4cec3933528bfca05341828ca7593.mp3"
}
```

## Hosting this server

I would recommend hosting this server on a local server, not connected to the internet. Amazon charges money for their Polly service, so it's not nice if someone else is using your Amazon credits to use TTS on their own systems.

If you're hosting this on a public server, be sure to put a reverse proxy in front of it, like nginx. And do some rate-limitting or ip whitelisting.

### Run your own server

1. Generate credentials in the [Amazon management console](https://console.aws.amazon.com/console/home).
2. Create `.env` file, use [.env-sample](./.env-sample)
3. Fire up the docker container `docker run --env-file .env -p 5601:5601 svrooij/sonos-tts-polly`
4. (optional) Map the cache folder to a folder to keep then after a restart.
5. (optional) Setup a reverse proxy in front of the node container.

### Run your own server (in node)

1. Generate credentials in the [Amazon management console](https://console.aws.amazon.com/console/home).
2. Install package `npm i -g @svrooij/sonos-tts-polly`
3. Run the app `sonos-tts-polly --port 5601 --amazonKey your_amazon_key --amazonSecret your_amazon_secret`

## Developer notes

1. Library is written in TypeScript
2. Build library with `npm run build`
3. Lint before commit `npm run lint` or `npm run lint-fix` (no errors allowed)
4. Build docker container `docker build .` or `docker build -t svrooij/sonos-tts-polly .`

### Debug in VSCode

Copy `.env-sample` to `.env` and input your Amazon credentials. Then you can debug this app by pressing `F5`.

## Contributing

Be nice to each other. This server is build in my spare time!

[badge_sponsor]: https://img.shields.io/badge/Sponsor-on%20Github-red?style=flat-square
[badge_issues]: https://img.shields.io/github/issues/svrooij/node-sonos-tts-polly?style=flat-square
[badge_npm]: https://img.shields.io/npm/v/@svrooij/sonos-tts-polly.svg?style=flat-square
[badge_docker]: https://img.shields.io/docker/pulls/svrooij/sonos-tts-polly?style=flat-square
[badge_sonos-cli]: https://img.shields.io/badge/sonos-cli-blue?style=flat-square
[badge_sonos-docs]: https://img.shields.io/badge/sonos-api-blue?style=flat-square
[badge_sonos-mqtt]: https://img.shields.io/badge/sonos-mqtt-blue?style=flat-square
[badge_sonos-typescript]: https://img.shields.io/badge/sonos-typescript-blue?style=flat-square

[link_sponsor]: https://github.com/sponsors/svrooij
[link_issues]: https://github.com/svrooij/node-sonos-tts-polly/issues
[link_npm]: https://www.npmjs.com/package/@svrooij/sonos-tts-polly
[link_docker]: https://hub.docker.com/r/svrooij/sonos-tts-polly
[link_sonos-cli]: https://github.com/svrooij/sonos-cli
[link_sonos-docs]: https://svrooij.io/sonos-api-docs
[link_sonos-mqtt]: https://svrooij.io/sonos2mqtt
[link_sonos-typescript]: https://svrooij.io/node-sonos-ts