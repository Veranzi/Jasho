# Jasho Frontend (Flutter)

Powering Your Hustle, Growing Your Wealth — This is the Flutter frontend for the Jasho super app. It implements onboarding/auth, dashboard, wallet, savings & loans, community, and a gamified points system with rewards.

---

## ✨ Features

- Points & Gamification
  - Jasho Points with levels, streaks, badges
  - Ways to earn points: login, profile, transactions, referrals, partner services (SACCO, Absa), savings streaks, milestones, security modules, 2FA, reviews, feedback
  - Rewards store: airtime/data, fee discounts, gift vouchers, premium analytics, partner rewards
- Savings
  - Savings goals with progress, hustle breakdown, contributions, weekly bonus points
- Loans
  - Microloans with eligibility derived from savings; Absa provides loans in this MVP
- Wallet
  - Deposit, withdraw, convert, set PIN
- Jobs & Community
  - Jobs listing, earnings view, transaction history, community board
- Security & Settings
  - Profile update, security settings, help, support chat

---

## 🧱 Tech Stack

- Flutter 3 (Material 3)
- State: Provider
- Platforms: Android, iOS, Web, Desktop

---

## ▶️ Run Locally

Prerequisites: Flutter SDK installed, device/emulator configured.

```bash
flutter pub get
flutter run -d chrome           # Web
flutter run -d android          # Android
flutter run -d ios              # iOS (macOS required)
```

To build release:

```bash
flutter build apk               # Android
flutter build ios               # iOS
flutter build web               # Web
```

---

## 📦 Project Structure

```
lib/
  main.dart              # App entry, theme, providers
  routes.dart            # Central route table
  providers/             # Provider state (auth, user, wallet, jobs, gamification, savings, etc.)
  screens/
    auth/                # Login, signup, KYC, splash, etc.
    dashboard/           # Dashboard, earnings, transactions, AI assistant
    wallet/              # Deposit, withdraw, convert, set PIN
    savings/             # Savings goals and loans
    gamification/        # Points, leaderboard, rewards
    settings/            # Profile, security, help
    support/             # Support chat
```

Key routes (see `lib/routes.dart`): `/splash`, `/login`, `/dashboard`, `/savings`, `/loans`, `/gamification`, `/leaderboard`, `/rewards`.

---

## 🔐 Environment & Backend

The backend is already provisioned. Integrations (e.g., auth, wallet, savings, Absa) should be configured in the providers or services layer once endpoints are available. This MVP uses local state via Providers and can be wired to HTTP clients later.

Where to add API calls:

- `lib/providers/auth_provider.dart`
- `lib/providers/user_provider.dart`
- `lib/providers/wallet_provider.dart`
- `lib/providers/savings_provider.dart`
- `lib/providers/gamification_provider.dart`

Add your base URL and HTTP client (e.g., `http` or `dio`) as needed and map responses to provider state.

---

## 🧩 Points Design (UX)

- Header: current points, level, progress to next level, daily streak
- Ways to Earn (grid):
  - Login daily (+5)
  - Complete profile (+20)
  - Send money / pay bills (+10 per txn)
  - Refer verified friend (+50)
  - Use partner services (SACCO, Absa) (+20)
  - Save consistently weekly (+5 bonus)
  - Reach milestones (+100)
  - Cybersecurity module (+30)
  - Enable 2FA / Internet Identity (+15)
  - Leave review (+10)
  - Give feedback (+5)
- Quick Redeem carousel: airtime/data, fee discounts, vouchers, premium features, partner rewards
- Rewards store page with gating by points

Files: `lib/screens/gamification/gamification_screen.dart`, `lib/screens/gamification/rewards_screen.dart`, `lib/screens/gamification/leaderboard_screen.dart`.

---

## 💰 Savings & Loans (Absa)

- Savings: create goals, contribute, view progress and hustle breakdown. Points earned on savings contributions and streaks.
- Loans: eligibility based on savings; loans are provided by **Absa** in this MVP. The Loans screen surfaces Absa branding and a clear application flow.

Files: `lib/screens/savings/savings_screen.dart`, `lib/screens/savings/loans_screen.dart`, `lib/providers/savings_provider.dart`.

---

## 🧠 State Management

Providers registered in `main.dart`:

- `AuthProvider`, `UserProvider`, `WalletProvider`, `JobsProvider`
- `GamificationProvider` (points, levels, badges)
- `SavingsProvider` (goals, loans, hustle breakdown)
- `AiProvider`, `LocaleProvider`, `PinProvider`

---

## 🧪 Testing

Run widget tests:

```bash
flutter test
```

---

## 🚀 Deploy (Web)

```bash
flutter build web
# Host the build at build/web/ on any static hosting service
```

---

## 🗺️ Roadmap (Frontend)

- Wire providers to backend endpoints
- Add analytics dashboards and premium gating via points
- Deepen Absa loan journey (KYC, offers, repayment schedule)
- Accessibility and localization improvements

---

## 🤝 Contributing

1. Create a feature branch
2. Make focused edits with clear commit messages
3. Open a PR with screenshots for UI changes

---

## 📜 License

MIT (see root LICENSE if present)
