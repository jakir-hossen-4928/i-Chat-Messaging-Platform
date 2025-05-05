export function initializeRingtone() {
  try {
    const ringtoneUrl = "/ringtone.mp3"; // Ensure this file exists in public/
    window.RINGTONE_URL = ringtoneUrl;
    console.log("Ringtone initialized:", ringtoneUrl);
    return ringtoneUrl;
  } catch (err) {
    console.error("Failed to initialize ringtone:", err);
    // Fallback to browser default sound
    window.RINGTONE_URL = "data:audio/mpeg;base64,//M=";
    return window.RINGTONE_URL;
  }
}

initializeRingtone();