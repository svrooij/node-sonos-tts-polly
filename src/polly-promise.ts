import { Polly } from "aws-sdk";
import { SynthesizeSpeechInput, SynthesizeSpeechOutput } from "aws-sdk/clients/polly";
export class PollyPromise {
  private polly: Polly;
  private voiceList?: Polly.VoiceList;
  constructor( options: Polly.ClientConfiguration ) {
    if (options.apiVersion === undefined) { options.apiVersion = "2016-06-10"; }
    this.polly = new Polly(options);
  }

  public DescribeVoices(): Promise<Polly.VoiceList> {
    return new Promise((resolve, reject) => {
      if (this.voiceList !== undefined) { resolve(this.voiceList); }
      this.polly.describeVoices((err, data) => {
        if (err) { reject(err); }
        this.voiceList = data.Voices;
        resolve(data.Voices);
      });
    });
  }

  public SynthesizeSpeech(options: SynthesizeSpeechInput): Promise<SynthesizeSpeechOutput> {
    if (options.OutputFormat === undefined) { options.OutputFormat = "mp3"; }
    return new Promise((resolve, reject) => {
      this.polly.synthesizeSpeech(options, (err, data) => {
        if (err) { reject(err); }
        resolve(data);
      });
    });
  }
}
