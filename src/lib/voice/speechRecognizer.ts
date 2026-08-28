// Browser Web Speech API interface definitions
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export type RecognitionLanguage = 'en-US' | 'hi-IN' | 'en-IN';

export interface SpeechRecognizerOptions {
  language?: RecognitionLanguage;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onSoundLevel?: (level: number) => void;
}

export class VoiceSpeechRecognizer {
  private recognition: any = null;
  private isListening: boolean = false;
  private options: SpeechRecognizerOptions;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private animationFrameId: number | null = null;

  constructor(options: SpeechRecognizerOptions = {}) {
    this.options = {
      language: 'en-US',
      continuous: true,
      interimResults: true,
      ...options,
    };
    this.initRecognition();
  }

  private initRecognition() {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      console.warn('Web Speech API is not supported in this browser environment.');
      return;
    }

    try {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = this.options.continuous;
      this.recognition.interimResults = this.options.interimResults;
      this.recognition.lang = this.options.language;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.options.onStart?.();
        this.startAudioVisualizer();
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript.trim()) {
          this.options.onResult?.(finalTranscript.trim(), true);
        } else if (interimTranscript.trim()) {
          this.options.onResult?.(interimTranscript.trim(), false);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition event:', event.error);
        if (event.error === 'not-allowed') {
          this.options.onError?.('Microphone permission denied. Please allow microphone access for voice commands.');
        } else if (event.error !== 'no-speech') {
          this.options.onError?.(`Speech recognition note: ${event.error}`);
        }
      };

      this.recognition.onend = () => {
        this.stopAudioVisualizer();
        // If continuous mode is on and we didn't explicitly call stop(), restart
        if (this.isListening && this.options.continuous) {
          try {
            this.recognition.start();
          } catch {
            this.isListening = false;
            this.options.onEnd?.();
          }
        } else {
          this.isListening = false;
          this.options.onEnd?.();
        }
      };
    } catch (e) {
      console.error('Failed to initialize SpeechRecognition:', e);
    }
  }

  public setLanguage(lang: RecognitionLanguage) {
    this.options.language = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public async start() {
    if (!this.recognition) {
      this.initRecognition();
    }
    if (!this.recognition) {
      this.options.onError?.('Speech recognition is unavailable in this browser. You can type commands directly in the prompt bar.');
      return;
    }

    try {
      this.isListening = true;
      this.recognition.start();
    } catch (e: any) {
      if (e.name !== 'InvalidStateError') {
        console.warn('Recognition start exception:', e);
      }
    }
  }

  public stop() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }
    this.stopAudioVisualizer();
    this.options.onEnd?.();
  }

  private async startAudioVisualizer() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return;
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(this.micStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkLevel = () => {
        if (!this.isListening || !this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength / 255;
        this.options.onSoundLevel?.(avg);
        this.animationFrameId = requestAnimationFrame(checkLevel);
      };
      checkLevel();
    } catch {
      // Non-critical visualizer fallback
    }
  }

  private stopAudioVisualizer() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.options.onSoundLevel?.(0);
  }

  public get active(): boolean {
    return this.isListening;
  }
}
