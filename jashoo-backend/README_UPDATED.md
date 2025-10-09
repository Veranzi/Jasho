## Jashoo Backend (Node/Express)

Express API that serves the Jashoo app. Firebase Admin is initialized via `firebaseAdmin.js` and service account under `../secrets/service-account.json`.

### Prerequisites
- Node 18+
- MongoDB (if required by models)
- Firebase service account JSON (path already present)

### Install
```bash
cd jashoo-backend
npm install
```

### Run (development)
```bash
npm run dev
```

### Environment
Create `.env` in `jashoo-backend`:

```
PORT=4000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:8080
MONGODB_URI=mongodb://localhost:27017/jashoo
```

`CLIENT_ORIGIN` is used for CORS. Adjust to your frontend URL. If using Flutter web: `http://localhost:51443` or the printed dev URL; for Chrome with `flutter run -d chrome`, use that origin.

### CORS
Ensure the server enables CORS similar to:

```js
const cors = require('cors');
app.use(cors({
  origin: process.env.CLIENT_ORIGIN?.split(',') || '*',
  credentials: true,
}));
```

### Routes
Mounted under files in `routes/`:
- `auth.js`, `user.js`, `wallet.js`, `savings.js`, `jobs.js`, `gamification.js`, `ai.js`, `chatbot.js`, `credit-score.js`, `profile-image.js`, `heatmap.js`

### Health check
`GET /health` should return service health (see `scripts/health-check.js`).

### Start script
`server.js` should export the app (for tests) and start listening unless `process.env.JASHOO_NO_LISTEN === 'true'`.

### Deployment
- Set `PORT`, `NODE_ENV`, `CLIENT_ORIGIN`, `MONGODB_URI`, and any API keys.


