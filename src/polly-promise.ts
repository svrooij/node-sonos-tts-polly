import { Polly } from 'aws-sdk';
import { SynthesizeSpeechInput, SynthesizeSpeechOutput } from 'aws-sdk/clients/polly';

export default class PollyPromise {
  private polly: Polly;

  private voiceList?: Polly.VoiceList;

  constructor(options: Polly.ClientConfiguration) {
    const optionsWithDefaults = { ...{ apiVersion: '2016-06-10' }, ...options };

    this.polly = new Polly(optionsWithDefaults);
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
    const optionsWithDefaults = { ...{ OutputFormat: 'mp3' }, ...options };

    return new Promise((resolve, reject) => {
      this.polly.synthesizeSpeech(optionsWithDefaults, (err, data) => {
        if (err) { reject(err); }
        resolve(data);
      });
    });
  }
}
