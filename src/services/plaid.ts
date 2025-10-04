import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { env } from '../config/env.js';

const cfg = new Configuration({
  basePath: PlaidEnvironments[env.PLAID_ENV as keyof typeof PlaidEnvironments] || PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': env.PLAID_CLIENT_ID || '',
      'PLAID-SECRET': env.PLAID_SECRET || '',
    }
  }
});

export const plaid = new PlaidApi(cfg);
