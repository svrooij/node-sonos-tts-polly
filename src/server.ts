import * as bodyparser from "body-parser";
import express from "express";
import { IConfigOptions } from "./config";
import { PollyPromise } from "./polly-promise";

import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

export class PollyTTSServer {
  private app = express();
  private polly?: PollyPromise;
  constructor(private options: IConfigOptions) {
    if (options.amazonKey === undefined || options.amazonSecret === undefined) {
      throw new Error("amazoneAccessKeyId and amazonSecretAccessKey are required");
    }

    if (options.cacheFolder === undefined) { throw new Error("Cache folder is required"); }

    this.setupStaticHosting(options.cacheFolder);

    this.registerEndpoints(options);
    this.startListening(options.port, options.runningInContainer);
    this.polly = new PollyPromise({
      accessKeyId: options.amazonKey,
      apiVersion: "2016-06-10",
      region: options.amazonRegion,
      secretAccessKey: options.amazonSecret });
  }

  private setupStaticHosting(cacheFolder: string) {
    if (!fs.existsSync(cacheFolder)) {
      fs.mkdirSync(cacheFolder);
    }
    this.app.use("/cache", express.static(cacheFolder));
  }

  private registerEndpoints(options: IConfigOptions) {
    this.app.use(bodyparser.json());
    this.app.get("/api/voices", async (req, res) => {
      if (this.options.logRequests) {
        console.log("%s - [%s] - \"GET /api/voices\" \"%s\"", req.ip, new Date(), req.headers["user-agent"]);
      }

      const voices = await this.polly?.DescribeVoices().catch((err) => {
        res.sendStatus(500);
        console.warn(err);
      });
      if (voices) {
        res.send(voices);
      }
    });

    if (options.allowGet) {
      this.app.get("/api/:lang/:text", async (req, res) => {
        const lang = req.params.lang;
        const ttsText = req.params.text;

        if (this.options.textLimit !== undefined && ttsText.length > this.options.textLimit) {
          res.sendStatus(400);
          return;
        }

        if (this.options.logRequests) {
          console.log("%s - [%s] - \"GET /api/%s\" \"%s\" \"%s\"",
            req.ip, new Date(), lang, ttsText, req.headers["user-agent"]);
        }

        await this.generateCacheFile(req.hostname, lang, ttsText).then((cacheResp) => {
          res.send(cacheResp);
        }).catch((err) => {
          res.sendStatus(500).send(err);
        });
      });
    }

    this.app.post("/api/generate", async (req, res) => {
      const lang = req.body.lang;
      const ttsText = req.body.text;
      const gender = req.body.gender;

      if (this.options.textLimit !== undefined && ttsText.length > this.options.textLimit) {
        res.sendStatus(400);
        return;
      }

      if (this.options.logRequests) {
        console.log("%s - [%s] - \"POST /api/generate\" %s \"%s\" \"%s\"",
          req.ip, new Date(), lang, ttsText, req.headers["user-agent"]);
      }
      await this.generateCacheFile(req.hostname, lang, ttsText, gender).then((cacheResp) => {
        res.send(cacheResp);
      }).catch((err) => {
        res.sendStatus(500).send(err);
      });
    });
  }

  private generateFilenameForText(lang: string, ttsText: string, gender?: string) {
    const hash = crypto.createHash("sha1")
      .update(`${lang}-${ttsText}-${gender}`.toLowerCase())
      .digest("hex");
    return `${hash}.mp3`;
  }

  private generateCacheFile(hostname: string, lang: string, ttsText: string, gender?: string):
    Promise<{ uri: string, cdnUri?: string }> {
    return new Promise(async (resolve, reject) => {
      if (hostname === "" || lang === "" || ttsText === "") {
        reject(new Error("Not all required paremeters are set"));
        return;
      }
      const filename = this.generateFilenameForText(lang, ttsText, gender);
      const folder = path.join(this.options.cacheFolder, lang);

      // Check if file exists else download file
      const cacheFile = path.join(folder, filename);
      if (!fs.existsSync(cacheFile)) {

        // Lookup first matching voice
        const voices = await this.polly?.DescribeVoices();
        const voice = voices?.find((v) =>
          v.LanguageCode?.toLowerCase() === lang.toLowerCase() &&
          (gender === undefined || v.Gender?.toLowerCase() === gender.toLowerCase())
        );
        if (voice === undefined || voice.Id === undefined) {
          reject(new Error("Language not found"));
          return;
        }

        // Check and create folder
        if (!fs.existsSync(folder)) {
          fs.mkdirSync(folder);
        }

        if (this.options.logRequests) {
          console.log("Generating text file %s with  %s", cacheFile, ttsText);
        }

        // Download and save speech file
        const voiceData = await this.polly?.SynthesizeSpeech({ OutputFormat: "mp3", VoiceId: voice.Id, Text: ttsText });
        if (voiceData === undefined) {
          reject(new Error("Speech could not be downloaded"));
          return;
        }
        fs.writeFileSync(cacheFile, voiceData.AudioStream);
      }

      const responseObject = {
        cdnUri: this.options.cacheUri !== undefined ? `${this.options.cacheUri}${lang}/${filename}` : undefined,
        uri: `http://${hostname}:${this.options.port}/cache/${lang}/${filename}`

      };
      resolve(responseObject);
    });

  }

  private startListening(port: number, inContainer?: boolean) {
    // See Express behind proxies https://expressjs.com/en/guide/behind-proxies.html
    if (inContainer === true) {
      this.app.set("trust proxy", "uniquelocal");
    }
    this.app.listen(port, () => {
      console.log(`Sonos TTS server started at http://0.0.0.0:${port}\nPress [CTRL]+C to close`);
    });
  }
}
