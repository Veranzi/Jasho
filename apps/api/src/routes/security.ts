import { Router } from "express";
import multer from "multer";
import axios from "axios";
import { verifyFirebaseToken, AuthedRequest } from "../middleware/auth";
import { basicUrlNormalize, mergeUrlScanResults, isAllowedMime, sanitizeFilename } from "@app/shared";
import vision from "@google-cloud/vision";

export const securityRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

securityRouter.use(verifyFirebaseToken);

// Google Safe Browsing v4 lookup
async function lookupSafeBrowsing(url: string) {
  const apiKey = process.env.SAFE_BROWSING_API_KEY;
  if (!apiKey) return { url, unsafe: false };
  const body = {
    client: { clientId: "secure-finance", clientVersion: "1.0" },
    threatInfo: {
      threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url }],
    },
  };
  const { data } = await axios.post(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`, body);
  const matches = data?.matches || [];
  return { url, unsafe: matches.length > 0, details: { matches } };
}

securityRouter.post("/scan-url", async (req: AuthedRequest, res) => {
  const { url } = req.body as { url: string };
  if (!url) return res.status(400).json({ error: "url_required" });
  const normalized = basicUrlNormalize(url);
  const sb = await lookupSafeBrowsing(normalized);
  const result = mergeUrlScanResults([sb]);
  return res.json({ result });
});

// QR scan: client decodes QR to URL/text; backend validates URL
securityRouter.post("/scan-qr", async (req: AuthedRequest, res) => {
  const { content } = req.body as { content: string };
  if (!content) return res.status(400).json({ error: "content_required" });
  if (/^https?:\/\//i.test(content)) {
    const sb = await lookupSafeBrowsing(content);
    const result = mergeUrlScanResults([sb]);
    return res.json({ result });
  }
  return res.json({ result: { url: content, unsafe: false } });
});

// Document upload scanning placeholder; in production integrate ClamAV/VirusTotal or Cloud Vision
securityRouter.post("/upload", upload.single("file"), async (req: AuthedRequest, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "file_required" });
  if (!isAllowedMime(file.mimetype)) return res.status(400).json({ error: "mime_not_allowed" });
  const safeName = sanitizeFilename(file.originalname);
  // SafeSearch using Cloud Vision if credentials present
  try {
    const client = new vision.ImageAnnotatorClient();
    const [result] = await client.safeSearchDetection({ image: { content: file.buffer } });
    const safe = result.safeSearchAnnotation;
    const adultLikely = ["LIKELY", "VERY_LIKELY"].includes(String(safe?.adult));
    const violenceLikely = ["LIKELY", "VERY_LIKELY"].includes(String(safe?.violence));
    if (adultLikely || violenceLikely) {
      return res.status(400).json({ error: "unsafe_image" });
    }
  } catch {
    // ignore if vision not configured
  }
  return res.json({ ok: true, name: safeName, size: file.size });
});
