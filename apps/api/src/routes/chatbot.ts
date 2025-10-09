import { Router } from "express";
import { verifyFirebaseToken, AuthedRequest } from "../middleware/auth";
import axios from "axios";
import speech from "@google-cloud/speech";
import tts from "@google-cloud/text-to-speech";

export const chatbotRouter = Router();

chatbotRouter.use(verifyFirebaseToken);

// Content moderation using OpenAI Moderations or GPT-4o-mini via /moderations
async function moderateText(text: string): Promise<{ allowed: boolean; categories?: any }>{
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { allowed: true };
  try {
    const { data } = await axios.post(
      "https://api.openai.com/v1/moderations",
      { model: "omni-moderation-latest", input: text },
      { headers: { Authorization: `Bearer ${key}` } }
    );
    const res = data?.results?.[0];
    return { allowed: !res?.flagged, categories: res?.categories };
  } catch {
    return { allowed: true };
  }
}

chatbotRouter.post("/moderate", async (req: AuthedRequest, res) => {
  const { text } = req.body as { text: string };
  if (!text) return res.status(400).json({ error: "text_required" });
  const moderation = await moderateText(text);
  return res.json({ moderation });
});

// Placeholder chat completion with moderation
chatbotRouter.post("/message", async (req: AuthedRequest, res) => {
  const { text } = req.body as { text: string };
  if (!text) return res.status(400).json({ error: "text_required" });
  const moderation = await moderateText(text);
  if (!moderation.allowed) return res.status(400).json({ error: "unsafe_content", moderation });
  // Basic echo with guard
  return res.json({ reply: `I can help with finance guidance. You said: ${text.slice(0, 200)}` });
});

// Voice: Accept audio and transcribe using GCP Speech-to-Text (if enabled)
chatbotRouter.post("/voice/transcribe", async (req: AuthedRequest, res) => {
  const { audioBase64 } = req.body as { audioBase64: string };
  if (!audioBase64) return res.status(400).json({ error: "audio_required" });
  try {
    const client = new speech.SpeechClient();
    const [response] = await client.recognize({
      audio: { content: audioBase64 },
      config: { languageCode: "en-US" },
    });
    const transcript = response.results?.map((r) => r.alternatives?.[0]?.transcript).join(" ") || "";
    const moderation = await moderateText(transcript);
    if (!moderation.allowed) return res.status(400).json({ error: "unsafe_content", moderation });
    return res.json({ transcript });
  } catch (e: any) {
    return res.status(500).json({ error: "stt_failed", message: e?.message });
  }
});

// Voice: Synthesize voice using GCP TTS
chatbotRouter.post("/voice/speak", async (req: AuthedRequest, res) => {
  const { text } = req.body as { text: string };
  if (!text) return res.status(400).json({ error: "text_required" });
  const moderation = await moderateText(text);
  if (!moderation.allowed) return res.status(400).json({ error: "unsafe_content", moderation });
  try {
    const client = new tts.TextToSpeechClient();
    const [response] = await client.synthesizeSpeech({
      input: { text },
      voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" },
      audioConfig: { audioEncoding: "MP3" },
    } as any);
    let audioBase64: string | undefined;
    const content: any = (response as any).audioContent;
    if (content instanceof Uint8Array) {
      audioBase64 = Buffer.from(content).toString("base64");
    } else if (typeof content === "string") {
      audioBase64 = content;
    }
    return res.json({ audioBase64 });
  } catch (e: any) {
    return res.status(500).json({ error: "tts_failed", message: e?.message });
  }
});
