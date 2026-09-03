import express from "express";
import axios from "axios";
import { generateConvoAiToken } from "../agora/tokenGenerator.js";

const router = express.Router();

router.post("/invite", async (req, res) => {
  const { channelName } = req.body;
  const agentUid = "9999";

  try {
    const token = generateConvoAiToken(channelName, agentUid);

   const response = await axios.post(
  `https://api.agora.io/api/conversational-ai-agent/v2/projects/${process.env.AGORA_APP_ID}/join`,
  {
    name: `syntrix-agent-${channelName}-${Date.now()}`,
    preset: "deepgram_nova_3,openai_gpt_5_mini,minimax_speech_2_6_turbo",
    properties: {
      channel: channelName,
      token,
      agent_rtc_uid: agentUid,
      remote_rtc_uids: ["*"],
      enable_rtm: true,
      llm: {
        system_messages: [{ role: "system", content: "You are SYNTRIX, an incident commander assistant. Keep responses brief." }],
      },
    },
  },
  {
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.AGORA_CUSTOMER_ID}:${process.env.AGORA_CUSTOMER_SECRET}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
  }
);
    res.json(response.data);
  } catch (err) {
    console.error("Agent invite error:", err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

export default router;