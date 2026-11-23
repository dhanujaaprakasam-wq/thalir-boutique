// Web Audio API Order Notification Sound Generator
// Generates a pleasant boutique bell chime without needing external audio file downloads

export const playOrderChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // Pleasant two-tone chime (E5 -> B5 harmonic)
    const playTone = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playTone(659.25, now, 0.6);        // E5
    playTone(987.77, now + 0.15, 0.9);  // B5
    playTone(1318.51, now + 0.35, 1.2); // E6 sparkle

  } catch (err) {
    console.warn('Audio chime playback notice:', err);
  }
};
