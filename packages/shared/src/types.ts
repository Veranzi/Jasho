export interface UserProfile {
  uid: string;
  phoneNumber: string;
  displayName?: string;
  email?: string;
  createdAt: number;
  kycVerified: boolean;
  roles: Array<"user" | "admin">;
  incomeMonthly?: number;
  occupation?: string;
  location?: { lat: number; lng: number; city?: string; country?: string };
}

export interface Transaction {
  id: string;
  uid: string;
  type: "deposit" | "withdrawal" | "transfer" | "payment";
  amount: number; // cents
  currency: string; // e.g. USD
  createdAt: number;
  metadata?: Record<string, unknown>;
  blockchainTxHash?: string;
}

export interface AccountBalance {
  uid: string;
  available: number;
  ledger: number;
  currency: string;
  updatedAt: number;
}

export interface CreditScore {
  uid: string;
  score: number; // 300-850
  factors: Array<{ key: string; weight: number; value: number; note?: string }>;
  computedAt: number;
}

export interface AiInsight {
  uid: string;
  insights: Array<{ title: string; detail: string; metric?: number }>;
  budgets?: Array<{ category: string; limit: number }>;
  predictedNeeds?: Array<{ period: string; amount: number }>;
  computedAt: number;
}

export interface UrlScanResult {
  url: string;
  unsafe: boolean;
  categories?: string[];
  details?: Record<string, unknown>;
}
