export function createAudioFile() {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const duration = 4; // 4 seconds loop
  const offlineContext = new OfflineAudioContext(2, duration * audioContext.sampleRate, audioContext.sampleRate);

  // Piano-like frequencies (C major chord: C4, E4, G4)
  const frequencies = [261.63, 329.63, 392.00];

  frequencies.forEach(frequency => {
    const oscillator = offlineContext.createOscillator();
    const gainNode = offlineContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, 0);

    // Envelope to create a more piano-like sound
    gainNode.gain.setValueAtTime(0, 0);
    gainNode.gain.linearRampToValueAtTime(0.2 / frequencies.length, 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.1 / frequencies.length, 0.5);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, duration);

    oscillator.connect(gainNode);
    gainNode.connect(offlineContext.destination);

    oscillator.start(0);
    oscillator.stop(duration);
  });

  return offlineContext.startRendering().then(buffer => {
    const blob = audioBufferToWav(buffer);
    return URL.createObjectURL(blob);
  });
}

function audioBufferToWav(buffer: AudioBuffer) {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new ArrayBuffer(length);
  const view = new DataView(out);
  const channels = [];
  let sample;
  let offset = 0;
  let pos = 0;

  // write WAVE header
  setUint32(0x46464952);
  setUint32(length - 8);
  setUint32(0x45564157);
  setUint32(0x20746d66);
  setUint32(16);
  setUint16(1);
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);
  setUint32(0x61746164);
  setUint32(length - pos - 4);

  // write interleaved data
  for (let i = 0; i < buffer.numberOfChannels; i++)
    channels.push(buffer.getChannelData(i));

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out], { type: 'audio/wav' });

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}