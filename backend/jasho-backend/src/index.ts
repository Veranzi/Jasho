import config from './config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import bodyParser from 'body-parser';

// Try to initialize Firebase admin if you have firebaseAdmin.ts/js
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('./firebaseAdmin');
} catch (e) {
  // if firebase initializer not present yet, continue — add it later
}

const app = express();

app.use(helmet());
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

const PORT = config.port || 3000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Jasho backend listening on port ${PORT}`);
});