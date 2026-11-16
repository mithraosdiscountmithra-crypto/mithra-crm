/**
 * Mithra CRM - Web Audio API Retail Order Bell Chime
 * Synthesizes a pleasant multi-tone cash register / order arrival notification
 * without requiring any external MP3 files or network assets.
 */
export function playOrderChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Harmonic retail bell chords: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz) -> C6 (1046Hz)
    const notes = [
      { freq: 523.25, time: 0.00, dur: 0.40, gain: 0.25 }, // C5
      { freq: 659.25, time: 0.10, dur: 0.45, gain: 0.30 }, // E5
      { freq: 783.99, time: 0.20, dur: 0.55, gain: 0.35 }, // G5
      { freq: 1046.50, time: 0.30, dur: 0.90, gain: 0.40 }, // C6 Bell
    ];

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, now + note.time);

      gainNode.gain.setValueAtTime(note.gain, now + note.time);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + note.time + note.dur);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + note.time);
      osc.stop(now + note.time + note.dur);
    });
  } catch (err) {
    console.warn('[Audio Alert] Could not play synthesized order chime:', err);
  }
}
