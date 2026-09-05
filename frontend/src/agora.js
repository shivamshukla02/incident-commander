import AgoraRTC from "agora-rtc-sdk-ng";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

export async function joinChannel(channelName, uid, onRemoteUserChange) {
  const res = await axios.post(`${API_URL}/api/agora/token`, { channelName, uid });
  const { token, appId } = res.data;

  // subscribe to remote users so everyone can hear each other + the AI agent
  client.on("user-published", async (user, mediaType) => {
    await client.subscribe(user, mediaType);
    if (mediaType === "audio") {
      user.audioTrack.play(); // plays their voice (or the AI agent's TTS) into your speakers
    }
    if (onRemoteUserChange) onRemoteUserChange(client.remoteUsers.map(u => u.uid));
  });

  client.on("user-unpublished", () => {
    if (onRemoteUserChange) onRemoteUserChange(client.remoteUsers.map(u => u.uid));
  });

client.on("stream-message", (uid, payload) => {
  try {
    const decoded = new TextDecoder().decode(payload);
    const parts = decoded.split("|");
    if (parts.length >= 4) {
      const base64Data = parts[3];
      const jsonStr = atob(base64Data);
      const data = JSON.parse(jsonStr);
      console.log("PARSED AGENT MESSAGE:", data);
      if (window.onAgentMessage) window.onAgentMessage(data, uid);
    }
  } catch (e) {
    console.log("stream message parse error:", e);
  }
});

  client.on("user-left", () => {
    if (onRemoteUserChange) onRemoteUserChange(client.remoteUsers.map(u => u.uid));
  });

  await client.join(appId, channelName, token, uid);

  const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
  await client.publish([audioTrack]);

  return audioTrack;
}

export async function leaveChannel(audioTrack) {
  if (audioTrack) {
    audioTrack.stop();
    audioTrack.close();
  }
  await client.leave();
}