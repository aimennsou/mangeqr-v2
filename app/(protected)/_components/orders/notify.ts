'use client';

/**
 * New-order alert sound (FEAT-1/D14). Uses the Web Audio API to synthesize a
 * short two-tone chime, so no audio asset is needed and it works offline. Guards
 * against SSR and autoplay restrictions (a no-op if the AudioContext can't run
 * until the user has interacted with the page).
 */
let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    if (!audioCtx) audioCtx = new Ctor();
    return audioCtx;
  } catch {
    return null;
  }
}

export function playNewOrderChime() {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    // Resume if suspended (some browsers suspend until a user gesture).
    if (ctx.state === 'suspended') void ctx.resume();
    const now = ctx.currentTime;
    const notes = [880, 1174.66]; // A5 then D6 — a friendly rising chime.
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + i * 0.16;
      const end = start + 0.16;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(end + 0.02);
    });
  } catch {
    /* ignore audio errors */
  }
}
