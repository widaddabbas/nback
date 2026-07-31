import type { AppConfig, StimulusValue } from '../types';

let audioContext: AudioContext | null = null;

export function prepareAudio(): void {
  try {
    const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctx && !audioContext) audioContext = new Ctx();
    if (audioContext?.state === 'suspended') void audioContext.resume();
  } catch {
    // Speech synthesis remains available as a fallback on many browsers.
  }
}

export function playAudioStimulus(value: StimulusValue, config: AppConfig): void {
  if (config.audio.mode === 'speech') {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(String(value));
      utterance.rate = config.audio.speechRate;
      utterance.volume = config.audio.volume;
      window.speechSynthesis.speak(utterance);
    }
    return;
  }

  try {
    prepareAudio();
    if (!audioContext) return;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = Number(value);
    gain.gain.value = Math.max(0, Math.min(1, config.audio.volume)) * 0.18;
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.22);
    oscillator.stop(audioContext.currentTime + 0.24);
  } catch {
    // Audio is non-critical; visual modalities should keep running.
  }
}
