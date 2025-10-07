import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

const config = {
  port: Number(process.env.PORT) || 3000,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'user',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'database',
  },
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret',
  apiUrl: process.env.API_URL || 'http://localhost:3000/api',
  firebase: {
    serviceAccountPath: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
  }
};

export default config;