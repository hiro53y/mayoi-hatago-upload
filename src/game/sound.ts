type BrowserAudioContext = typeof AudioContext;

let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (audioContext) return audioContext;
  const AudioContextCtor: BrowserAudioContext | undefined =
    window.AudioContext ?? (window as typeof window & { webkitAudioContext?: BrowserAudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;
  audioContext = new AudioContextCtor();
  return audioContext;
}

export function playSlashHitSe() {
  const context = getAudioContext();
  if (!context) return;

  const start = context.currentTime;
  const duration = 0.16;
  const output = context.createGain();
  output.gain.setValueAtTime(0.0001, start);
  output.gain.exponentialRampToValueAtTime(0.22, start + 0.012);
  output.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  output.connect(context.destination);

  const sweep = context.createOscillator();
  sweep.type = 'sawtooth';
  sweep.frequency.setValueAtTime(980, start);
  sweep.frequency.exponentialRampToValueAtTime(220, start + duration);
  sweep.connect(output);
  sweep.start(start);
  sweep.stop(start + duration);

  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * duration), context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    const fade = 1 - i / data.length;
    data[i] = (Math.random() * 2 - 1) * fade * fade;
  }
  const noise = context.createBufferSource();
  const noiseFilter = context.createBiquadFilter();
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.setValueAtTime(1200, start);
  noise.buffer = buffer;
  noise.connect(noiseFilter);
  noiseFilter.connect(output);
  noise.start(start);
  noise.stop(start + duration);
}
