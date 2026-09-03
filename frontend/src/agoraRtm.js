import AgoraRTM from "agora-rtm";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

let rtmClient = null;

export async function loginRtm(channelName, uid, onTranscript) {
  const res = await axios.post(`${API_URL}/api/agora/rtm-token`, { channelName, uid: String(uid) });
  const { token, appId } = res.data;

  rtmClient = new AgoraRTM.RTM(appId, String(uid));
  await rtmClient.login({ token });

  const channel = await rtmClient.subscribe(channelName);

  rtmClient.addEventListener("message", (event) => {
    try {
      const payload = JSON.parse(event.message);
      // Agora's Conversational AI Engine sends transcript events; adjust the check below
      // based on the actual payload shape once you see real messages in console
      if (payload.object === "message.transcribe" || payload.type === "transcribe") {
        const text = payload.text || payload.transcript;
        const speaker = payload.uid === "9999" ? "SYNTRIX Agent" : "Participant";
        if (text) onTranscript(text, speaker, "participant");
      }
    } catch (e) {
      console.log("RTM raw message:", event.message);
    }
  });

  return rtmClient;
}

export async function logoutRtm() {
  if (rtmClient) {
    await rtmClient.logout();
    rtmClient = null;
  }
}