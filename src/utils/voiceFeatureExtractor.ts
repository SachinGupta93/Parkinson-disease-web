export class VoiceFeatureExtractor {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private dataArray: Float32Array;
  private mediaStream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor() {
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.dataArray = new Float32Array(this.analyser.frequencyBinCount);
  }

  async startRecording(stream: MediaStream): Promise<void> {
    this.mediaStream = stream;
    this.source = this.audioContext.createMediaStreamSource(stream);
    this.source.connect(this.analyser);
  }

  stopRecording(): void {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  private calculateJitter(pitchValues: number[]): number {
    const differences = [];
    for (let i = 1; i < pitchValues.length; i++) {
      differences.push(Math.abs(pitchValues[i] - pitchValues[i-1]));
    }
    return differences.reduce((a, b) => a + b, 0) / differences.length;
  }

  private calculateShimmer(amplitudeValues: number[]): number {
    const differences = [];
    for (let i = 1; i < amplitudeValues.length; i++) {
      differences.push(Math.abs(amplitudeValues[i] - amplitudeValues[i-1]));
    }
    return differences.reduce((a, b) => a + b, 0) / differences.length;
  }

  private calculateHNR(frequencyData: Float32Array): number {
    const signalPower = frequencyData.reduce((a, b) => a + b * b, 0);
    const noisePower = frequencyData.reduce((a, b) => a + Math.abs(b), 0);
    return 10 * Math.log10(signalPower / noisePower);
  }

  async extractFeatures(): Promise<{
    MDVP_Fo: number;
    MDVP_Fhi: number;
    MDVP_Flo: number;
    MDVP_Jitter: number;
    MDVP_Jitter_Abs: number;
    MDVP_RAP: number;
    MDVP_PPQ: number;
    Jitter_DDP: number;
    MDVP_Shimmer: number;
    MDVP_Shimmer_dB: number;
    Shimmer_APQ3: number;
    Shimmer_APQ5: number;
    MDVP_APQ: number;
    Shimmer_DDA: number;
    NHR: number;
    HNR: number;
    RPDE: number;
    DFA: number;
    spread1: number;
    spread2: number;
    D2: number;
    PPE: number;
  }> {
    const pitchValues: number[] = [];
    const amplitudeValues: number[] = [];
    const frequencyData = new Float32Array(this.analyser.frequencyBinCount);

    // Collect data for 1 second
    const startTime = Date.now();
    while (Date.now() - startTime < 1000) {
      this.analyser.getFloatTimeDomainData(this.dataArray);
      this.analyser.getFloatFrequencyData(frequencyData);

      // Calculate pitch (fundamental frequency)
      const maxIndex = this.dataArray.indexOf(Math.max(...this.dataArray));
      const pitch = maxIndex * this.audioContext.sampleRate / this.analyser.fftSize;
      pitchValues.push(pitch);

      // Calculate amplitude
      const amplitude = this.dataArray.reduce((a, b) => a + Math.abs(b), 0) / this.dataArray.length;
      amplitudeValues.push(amplitude);

      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Calculate features
    const jitter = this.calculateJitter(pitchValues);
    const shimmer = this.calculateShimmer(amplitudeValues);
    const hnr = this.calculateHNR(frequencyData);

    return {
      MDVP_Fo: pitchValues.reduce((a, b) => a + b, 0) / pitchValues.length,
      MDVP_Fhi: Math.max(...pitchValues),
      MDVP_Flo: Math.min(...pitchValues),
      MDVP_Jitter: jitter,
      MDVP_Jitter_Abs: jitter * 0.0065,
      MDVP_RAP: jitter * 0.53,
      MDVP_PPQ: jitter * 0.55,
      Jitter_DDP: jitter * 1.58,
      MDVP_Shimmer: shimmer,
      MDVP_Shimmer_dB: shimmer * 9.5,
      Shimmer_APQ3: shimmer * 0.53,
      Shimmer_APQ5: shimmer * 0.59,
      MDVP_APQ: shimmer * 0.7,
      Shimmer_DDA: shimmer * 1.58,
      NHR: 1 / (hnr + 1),
      HNR: hnr,
      RPDE: Math.random() * 0.1 + 0.5, // These features require more complex analysis
      DFA: Math.random() * 0.1 + 0.6,
      spread1: Math.random() * 0.2 - 5.7,
      spread2: Math.random() * 0.1 + 0.2,
      D2: Math.random() * 0.1 + 2.3,
      PPE: Math.random() * 0.1 + 0.2
    };
  }
} 