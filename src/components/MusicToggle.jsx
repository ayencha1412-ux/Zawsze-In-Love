import { useEffect, useRef, useState } from 'react';

export default function MusicToggle() {
  const [playing, setPlaying] = useState(false);
  const contextRef = useRef(null);
  const oscillatorsRef = useRef([]);

  const stopMusic = () => {
    oscillatorsRef.current.forEach((osc) => {
      try { osc.stop(); } catch { /* already stopped */ }
    });
    oscillatorsRef.current = [];
    if (contextRef.current) {
      contextRef.current.close();
      contextRef.current = null;
    }
    setPlaying(false);
  };

  const startMusic = async () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const context = new AudioContext();
    contextRef.current = context;
    if (context.state === 'suspended') await context.resume();

    const master = context.createGain();
    master.gain.value = 0.032;
    master.connect(context.destination);

    const frequencies = [261.63, 329.63, 392.0];
    oscillatorsRef.current = frequencies.map((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = index === 0 ? 'sine' : 'triangle';
      oscillator.frequency.value = frequency / 2;
      gain.gain.value = index === 0 ? 0.55 : 0.18;
      oscillator.connect(gain).connect(master);
      oscillator.start();
      return oscillator;
    });

    setPlaying(true);
  };

  useEffect(() => () => stopMusic(), []);

  return (
    <button
      className={`music-btn ${playing ? 'playing' : ''}`}
      type="button"
      onClick={() => (playing ? stopMusic() : startMusic())}
      aria-pressed={playing}
    >
      <span className="music-icon" aria-hidden="true">♫</span>
      {playing ? 'music on' : 'soft music'}
      <span className="music-wave" aria-hidden="true"><i /><i /><i /></span>
    </button>
  );
}
