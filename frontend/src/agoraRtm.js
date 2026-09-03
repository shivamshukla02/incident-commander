import AgoraRTM from "agora-rtm";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

let rtmClient = null;

export async function loginRtm(channelName, uid, onTranscript) {
  console.log("loginRtm called with:", channelName, uid);

  const res = await axios.post(`${API_URL}/api/agora/rtm-token`, { channelName, uid: String(uid) });
  console.log("rtm token response:", res.data);
  const { token, appId } = res.data;

  rtmClient = new AgoraRTM.RTM(appId, String(uid));
  await rtmClient.login({ token });
  console.log("RTM login successful");

  const channel = await rtmClient.subscribe(channelName);
  console.log("RTM subscribed to channel");

  rtmClient.addEventListener("message", (event) => {
    console.log("RTM raw message:", event.message);
    try {
      const payload = JSON.parse(event.message);
      if (payload.object === "message.transcribe" || payload.type === "transcribe") {
        const text = payload.text || payload.transcript;
        const speaker = payload.uid === "9999" ? "SYNTRIX Agent" : "Participant";
        if (text) onTranscript(text, speaker, "participant");
      }
    } catch (e) {
      console.log("failed to parse RTM message:", e);
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