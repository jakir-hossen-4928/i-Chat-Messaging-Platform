
// Function to create a ringtone audio data URL
function createRingtone() {
  try {
    // Use Web Audio API for better performance and compatibility
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const sampleRate = audioContext.sampleRate;
    const duration = 3.0; // 3 second ringtone
    const numSamples = Math.floor(duration * sampleRate);
    const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate a pleasant ringtone sound
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      
      // Primary tone (higher)
      const freq1 = 880 + Math.sin(t * 4) * 30;
      const tone1 = Math.sin(freq1 * 2 * Math.PI * t);
      
      // Secondary tone (lower)
      const freq2 = 440 + Math.sin(t * 2) * 20;
      const tone2 = Math.sin(freq2 * 2 * Math.PI * t);
      
      // Combine tones
      const combinedTone = 0.6 * tone1 + 0.4 * tone2;
      
      // Apply envelope for nicer sound
      const envelope = Math.sin(Math.PI * (t % 0.6) / 0.6);
      const pulseEnvelope = t % 1.0 < 0.6 ? envelope : 0;
      
      // Final sample with envelope
      data[i] = combinedTone * pulseEnvelope * 0.5;
    }
    
    // Convert buffer to WAV format
    const wavData = bufferToWave(buffer, numSamples);
    const blob = new Blob([wavData], { type: 'audio/wav' });
    const ringtoneUrl = URL.createObjectURL(blob);
    
    console.log("Ringtone created successfully");
    window.RINGTONE_URL = ringtoneUrl;
    return ringtoneUrl;
  } catch (err) {
    console.error("Failed to create ringtone:", err);
    return null;
  }
}

// Convert AudioBuffer to WAV format
function bufferToWave(buffer, numSamples) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  
  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);
  
  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // File size
  view.setUint32(4, 36 + dataSize, true);
  // WAVE identifier
  writeString(view, 8, 'WAVE');
  // Format chunk identifier
  writeString(view, 12, 'fmt ');
  // Format chunk size
  view.setUint32(16, 16, true);
  // Audio format (PCM)
  view.setUint16(20, 1, true);
  // Number of channels
  view.setUint16(22, numChannels, true);
  // Sample rate
  view.setUint32(24, sampleRate, true);
  // Byte rate
  view.setUint32(28, byteRate, true);
  // Block align
  view.setUint16(32, blockAlign, true);
  // Bits per sample
  view.setUint16(34, bitsPerSample, true);
  // Data chunk identifier
  writeString(view, 36, 'data');
  // Data chunk size
  view.setUint32(40, dataSize, true);
  
  // Write the PCM samples
  const data = new Float32Array(buffer.getChannelData(0));
  let offset = headerSize;
  for (let i = 0; i < numSamples; i++) {
    const sample = Math.max(-1, Math.min(1, data[i]));
    const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    view.setInt16(offset, value, true);
    offset += bytesPerSample;
  }
  
  return view;
}

// Helper function to write a string to a DataView
function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Create the ringtone when the script loads
try {
  createRingtone();
} catch(e) {
  console.error("Error creating ringtone:", e);
}
