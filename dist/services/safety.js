import axios from 'axios';
import { env } from '../config/env.js';
import { fileTypeFromBuffer } from 'file-type';
import pdfParse from 'pdf-parse';
import Jimp from 'jimp';
import QrCode from 'qrcode-reader';
import { logger } from '../utils/logger.js';
export async function checkUrlSafety(url) {
    // Google Safe Browsing Lookup API v4
    if (!env.SAFE_BROWSING_API_KEY)
        return { safe: true, reason: 'not_configured' };
    try {
        const body = {
            client: { clientId: 'secure-finance', clientVersion: '1.0.0' },
            threatInfo: {
                threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
                platformTypes: ['ANY_PLATFORM'],
                threatEntryTypes: ['URL'],
                threatEntries: [{ url }],
            }
        };
        const res = await axios.post(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${env.SAFE_BROWSING_API_KEY}`, body);
        if (res.data && res.data.matches && res.data.matches.length > 0) {
            return { safe: false, reason: 'threat_match', matches: res.data.matches };
        }
        return { safe: true };
    }
    catch (e) {
        logger.warn('Safe Browsing check failed', { error: String(e) });
        return { safe: true, reason: 'check_failed' };
    }
}
export async function scanDocument(buffer) {
    const ft = await fileTypeFromBuffer(buffer);
    if (!ft)
        return { safe: false, reason: 'unknown_file_type' };
    const mime = ft.mime;
    if (mime === 'application/pdf') {
        try {
            await pdfParse(buffer);
            return { safe: true, type: 'pdf' };
        }
        catch {
            return { safe: false, reason: 'pdf_parse_failed' };
        }
    }
    if (mime.startsWith('image/')) {
        try {
            const image = await Jimp.read(buffer);
            const qr = new QrCode();
            const decoded = await new Promise((resolve) => {
                const out = [];
                qr.callback = (_err, value) => {
                    if (value && value.result)
                        out.push(value.result);
                    resolve(out);
                };
                // @ts-ignore
                qr.decode(image.bitmap);
            });
            const unsafeDecodes = [];
            for (const u of decoded) {
                const c = await checkUrlSafety(u);
                if (!c.safe)
                    unsafeDecodes.push(u);
            }
            if (unsafeDecodes.length > 0)
                return { safe: false, reason: 'qr_unsafe', urls: unsafeDecodes };
            return { safe: true, type: 'image' };
        }
        catch {
            return { safe: false, reason: 'image_processing_failed' };
        }
    }
    return { safe: false, reason: 'unsupported_type', mime };
}
