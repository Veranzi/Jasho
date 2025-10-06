"use client";
import { useState, useEffect } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier, onAuthStateChanged, signOut } from "firebase/auth";
import useSWR from "swr";
import toast, { Toaster } from "react-hot-toast";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!,
};

let initialAuth: any = null;
if (typeof window !== 'undefined') {
  try {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    initialAuth = getAuth(app);
  } catch (e) {
    // ignore during SSR/prerender
  }
}

const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";
const fetcher = (url: string, token?: string) => fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then(r => r.json());

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>("");
  const [auth, setAuth] = useState<any>(initialAuth);
  const [phone, setPhone] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [confirmResult, setConfirmResult] = useState<any>(null);

  useEffect(() => {
    if (!auth && typeof window !== 'undefined') {
      try {
        const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
        setAuth(getAuth(app));
      } catch {}
    }
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setToken(u ? await u.getIdToken() : "");
    });
    return () => unsub();
  }, [auth]);

  const { data: me } = useSWR(user && token ? [`${apiBase}/user/me`, token] : null, ([url, t]) => fetcher(url, t));
  const { data: balance } = useSWR(user && token ? [`${apiBase}/transactions/balance?currency=USD&includeMask=true`, token] : null, ([url, t]) => fetcher(url, t));
  const [aiInsights, setAiInsights] = useState<any>(null);

  async function startPhoneSignin() {
    try {
      if (!auth) throw new Error('Auth not ready');
      const w = window as any;
      w.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      const confirmation = await signInWithPhoneNumber(auth, phone, w.recaptchaVerifier);
      setConfirmResult(confirmation);
      toast.success('Code sent');
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function verifyCode() {
    try {
      await confirmResult.confirm(code);
      toast.success('Signed in');
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function createDeposit() {
    const res = await fetch(`${apiBase}/transactions/create`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ type: 'deposit', amount: 10000, currency: 'USD' }) });
    const data = await res.json();
    if (data.ok) toast.success('Deposited $100'); else toast.error('Failed');
  }

  async function exportHistory() {
    const res = await fetch(`${apiBase}/transactions/export`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ confirm: 'I_UNDERSTAND_SENSITIVE' }) });
    const data = await res.json();
    if (data.csv) {
      const blob = new Blob([data.csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'transactions.csv'; a.click();
    }
  }

  async function scanUrl() {
    const url = prompt('Enter URL to scan');
    if (!url) return;
    const res = await fetch(`${apiBase}/security/scan-url`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ url }) });
    const data = await res.json();
    if (data.result?.unsafe) toast.error('Unsafe URL detected'); else toast.success('URL looks safe');
  }

  async function sendChat() {
    const text = prompt('Say something to the assistant');
    if (!text) return;
    const res = await fetch(`${apiBase}/chatbot/message`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ text }) });
    const data = await res.json();
    if (data.reply) toast.success(data.reply); else toast.error('Blocked');
  }

  async function computeInsights() {
    const res1 = await fetch(`${apiBase}/ai/score`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
    const res2 = await fetch(`${apiBase}/ai/insights`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
    const d1 = await res1.json(); const d2 = await res2.json();
    setAiInsights({ score: d1.score, insights: d2.insights });
  }

  return (
    <div>
      <Toaster />
      <div className="card">
        <h2>Sign in with SMS</h2>
        {user ? (
          <div>
            <p>Logged in as {user.phoneNumber}</p>
            <button className="button" onClick={() => auth && signOut(auth)}>Sign out</button>
          </div>
        ) : (
          <div>
            <input className="input" placeholder="+123456789" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <div id="recaptcha-container" />
            {!confirmResult ? (
              <button className="button" onClick={startPhoneSignin}>Send Code</button>
            ) : (
              <div>
                <input className="input" placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} />
                <button className="button" onClick={verifyCode}>Verify</button>
              </div>
            )}
          </div>
        )}
      </div>

      {user && (
        <div className="grid">
          <div className="card">
            <h3>Profile</h3>
            <pre>{JSON.stringify(me?.profile, null, 2)}</pre>
          </div>
          <div className="card">
            <h3>Balance (masked)</h3>
            <pre>{JSON.stringify(balance, null, 2)}</pre>
            <button className="button" onClick={createDeposit}>Deposit $100</button>
          </div>
          <div className="card">
            <h3>Security</h3>
            <button className="button" onClick={scanUrl}>Scan URL</button>
            <button className="button" onClick={exportHistory}>Export History (locked)</button>
          </div>
          <div className="card">
            <h3>Chatbot</h3>
            <button className="button" onClick={sendChat}>Send Message</button>
          </div>
          <div className="card">
            <h3>AI Insights</h3>
            <button className="button" onClick={computeInsights}>Compute Credit Score & Insights</button>
            <pre>{JSON.stringify(aiInsights, null, 2)}</pre>
          </div>
          <HeatmapCard />
        </div>
      )}
    </div>
  );
}

function HeatmapCard() {
  const Heatmap = require('./heatmap/Heatmap').default;
  return <Heatmap />;
}
