import type { Transaction, CreditScore, AiInsight, UserProfile } from "./types";

export function computeCreditScore(
  user: UserProfile,
  transactions: Transaction[],
  otherLoansOutstanding = 0
): CreditScore {
  const now = Date.now();
  const income = sumAmounts(transactions.filter((t) => t.type === "deposit"));
  const expenses = sumAmounts(
    transactions.filter((t) => t.type === "withdrawal" || t.type === "payment")
  );
  const utilization = expenses > 0 ? expenses / Math.max(income, 1) : 0;
  const onTimePayments = paymentOnTimeRatio(transactions);
  const incomeStability = stabilityScore(transactions);

  // Weighted factors mapped approximately to FICO-like notions
  const factors = [
    { key: "income", weight: 0.25, value: clamp01(income / 1000000) },
    { key: "utilization", weight: 0.30, value: 1 - clamp01(utilization) },
    { key: "payment_history", weight: 0.30, value: onTimePayments },
    { key: "stability", weight: 0.10, value: incomeStability },
    { key: "debt", weight: 0.05, value: 1 - clamp01(otherLoansOutstanding / 1000000) },
  ];

  const normalized = factors.reduce(
    (acc, f) => acc + f.weight * f.value,
    0
  );
  const score = Math.round(300 + normalized * 550);

  return {
    uid: user.uid,
    score,
    factors: factors.map((f) => ({ key: f.key, weight: f.weight, value: f.value })),
    computedAt: now,
  };
}

export function deriveAiInsights(
  user: UserProfile,
  transactions: Transaction[]
): AiInsight {
  const now = Date.now();
  const income = sumAmounts(transactions.filter((t) => t.type === "deposit"));
  const expenses = sumAmounts(
    transactions.filter((t) => t.type === "withdrawal" || t.type === "payment")
  );
  const savings = Math.max(0, income - expenses);

  const monthlyAvgExpense = rollingMonthlyAverage(transactions, ["withdrawal", "payment"]);
  const predictedNextMonthNeeds = Math.round(monthlyAvgExpense * 1.05);

  const insights = [
    { title: "Savings", detail: `Monthly savings estimate $${(savings/100).toFixed(2)}`, metric: savings },
    { title: "Income", detail: `Monthly income $${(income/100).toFixed(2)}`, metric: income },
    { title: "Expenses", detail: `Monthly expenses $${(expenses/100).toFixed(2)}`, metric: expenses },
  ];

  const budgets = suggestBudgets(transactions);
  const predictedNeeds = [
    { period: "next_month", amount: predictedNextMonthNeeds }
  ];

  return { uid: user.uid, insights, budgets, predictedNeeds, computedAt: now };
}

function rollingMonthlyAverage(transactions: Transaction[], types: Transaction["type"][]): number {
  const now = Date.now();
  const ms30 = 30 * 24 * 60 * 60 * 1000;
  const windowed = transactions.filter((t) => types.includes(t.type) && now - t.createdAt < 180 * 24 * 60 * 60 * 1000);
  if (windowed.length === 0) return 0;
  const months = 6;
  const total = sumAmounts(windowed);
  return Math.round(total / months);
}

function stabilityScore(transactions: Transaction[]): number {
  // Measures variance of monthly deposits as stability proxy
  const deposits = transactions.filter((t) => t.type === "deposit");
  if (deposits.length < 3) return 0.5;
  const byMonth: Record<string, number> = {};
  for (const t of deposits) {
    const d = new Date(t.createdAt);
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()+1}`;
    byMonth[key] = (byMonth[key] || 0) + t.amount;
  }
  const values = Object.values(byMonth);
  if (values.length < 2) return 0.6;
  const avg = values.reduce((a,b)=>a+b,0) / values.length;
  const variance = values.reduce((a,b)=> a + Math.pow(b-avg,2), 0) / values.length;
  const coeff = avg === 0 ? 1 : Math.sqrt(variance) / avg;
  return Math.max(0, Math.min(1, 1 - coeff));
}

function suggestBudgets(transactions: Transaction[]) {
  const categories: Record<string, number> = {};
  for (const t of transactions) {
    const category = (t.metadata?.["category"] as string) || "misc";
    categories[category] = (categories[category] || 0) + t.amount;
  }
  const entries = Object.entries(categories).sort((a,b) => b[1]-a[1]).slice(0,5);
  return entries.map(([category, amount]) => ({ category, limit: Math.round(amount * 0.9) }));
}

function sumAmounts(transactions: Transaction[]): number {
  return transactions.reduce((acc, t) => acc + Math.round(t.amount), 0);
}

function clamp01(v: number): number { return Math.max(0, Math.min(1, v)); }

function paymentOnTimeRatio(transactions: Transaction[]): number {
  // Assume metadata.dueDate and metadata.paidAt for payments
  const payments = transactions.filter((t) => t.type === "payment");
  if (payments.length === 0) return 1;
  let onTime = 0;
  for (const p of payments) {
    const due = Number(p.metadata?.["dueDate"]) || 0;
    const paid = Number(p.metadata?.["paidAt"]) || p.createdAt;
    if (paid <= due) onTime += 1;
  }
  return onTime / payments.length;
}
