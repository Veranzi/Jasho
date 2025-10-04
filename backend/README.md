# Jashoo Backend API

A comprehensive backend API for the Jashoo financial services application, built with Node.js, Express, and MongoDB. This API supports gig economy workers in Kenya with features for job marketplace, wallet management, savings goals, gamification, and AI-powered financial insights.

## Features

- **Authentication & User Management**: JWT-based authentication with KYC verification
- **Wallet System**: Multi-currency wallet (KES/USDT) with transaction PIN security
- **Job Marketplace**: Post, apply, and manage gig jobs (Boda Boda, Mama Fua, etc.)
- **Savings & Loans**: Create savings goals, make contributions, request loans
- **Gamification**: Points, levels, badges, and achievements system
- **AI Insights**: Bilingual (English/Swahili) financial suggestions and market trends
- **Real-time Analytics**: Comprehensive financial insights and statistics

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs, helmet, cors, rate limiting
- **Validation**: express-validator
- **File Upload**: multer

## Quick Start

### Prerequisites

- Node.js 18 or higher
- MongoDB 4.4 or higher
- npm or yarn

### Installation

1. **Clone and navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/jashoo
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=7d
   ```

4. **Initialize the database**:
   ```bash
   npm run init-db
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login user | No |
| GET | `/me` | Get current user profile | Yes |
| POST | `/refresh` | Refresh JWT token | Yes |
| POST | `/logout` | Logout user | Yes |
| POST | `/check-email` | Check email availability | No |
| POST | `/check-phone` | Check phone availability | No |

### User Management (`/api/user`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/profile` | Get user profile | Yes |
| PUT | `/profile` | Update user profile | Yes |
| POST | `/kyc` | Complete KYC verification | Yes |
| POST | `/absa-account` | Link Absa account | Yes |
| PUT | `/language` | Update language preference | Yes |
| PUT | `/notifications` | Update notification preferences | Yes |
| GET | `/:userId` | Get public user profile | No |
| DELETE | `/account` | Deactivate account | Yes |

### Wallet (`/api/wallet`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/balance` | Get wallet balance | Yes |
| GET | `/transactions` | Get transaction history | Yes |
| POST | `/pin` | Set transaction PIN | Yes |
| POST | `/verify-pin` | Verify transaction PIN | Yes |
| POST | `/deposit` | Deposit money | Yes |
| POST | `/withdraw` | Withdraw money | Yes |
| POST | `/convert` | Convert currency | Yes |
| POST | `/transfer` | Transfer to another user | Yes |

### Jobs (`/api/jobs`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all jobs (with filters) | Yes |
| GET | `/:id` | Get job by ID | Yes |
| POST | `/` | Post new job | Yes |
| POST | `/:id/apply` | Apply for job | Yes |
| GET | `/:id/applications` | Get job applications | Yes |
| POST | `/:id/accept/:applicationId` | Accept application | Yes |
| POST | `/:id/complete` | Complete job | Yes |
| GET | `/user/:type` | Get user's jobs (posted/assigned) | Yes |
| GET | `/applications/my` | Get user's applications | Yes |
| POST | `/:id/cancel` | Cancel job | Yes |

### Savings (`/api/savings`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/goals` | Get savings goals | Yes |
| GET | `/goals/:id` | Get goal by ID | Yes |
| POST | `/goals` | Create savings goal | Yes |
| PUT | `/goals/:id` | Update savings goal | Yes |
| POST | `/goals/:id/contribute` | Contribute to goal | Yes |
| GET | `/goals/:id/contributions` | Get goal contributions | Yes |
| DELETE | `/goals/:id` | Delete savings goal | Yes |
| GET | `/loans` | Get loan requests | Yes |
| GET | `/loans/:id` | Get loan by ID | Yes |
| POST | `/loans` | Request loan | Yes |
| GET | `/statistics` | Get savings statistics | Yes |

### Gamification (`/api/gamification`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/profile` | Get gamification profile | Yes |
| GET | `/leaderboard` | Get leaderboard | Yes |
| GET | `/badges` | Get available badges | Yes |
| POST | `/redeem` | Redeem points | Yes |
| GET | `/achievements` | Get achievements | Yes |
| GET | `/statistics` | Get gamification statistics | Yes |
| POST | `/award-badge` | Award badge (admin) | Yes |
| POST | `/init-badges` | Initialize default badges | Yes |

### AI Insights (`/api/ai`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/suggestions` | Get AI suggestions | Yes |
| GET | `/insights` | Get financial insights | Yes |
| GET | `/market-trends` | Get market trends | Yes |

## Data Models

### User
```javascript
{
  userId: String,
  email: String,
  phoneNumber: String,
  password: String (hashed),
  fullName: String,
  skills: [String],
  location: String,
  rating: Number,
  isVerified: Boolean,
  kyc: {
    idType: String,
    idNumber: String,
    photoUrl: String,
    verifiedAt: Date
  },
  absaAccountNumber: String,
  preferences: {
    language: String,
    notifications: Object
  }
}
```

### Wallet
```javascript
{
  userId: String,
  kesBalance: Number,
  usdtBalance: Number,
  transactionPinHash: String,
  pinAttempts: Number,
  pinLockedUntil: Date
}
```

### Transaction
```javascript
{
  userId: String,
  type: String, // deposit, withdrawal, earning, convert, transfer, payment
  amount: Number,
  currencyCode: String, // KES, USDT
  status: String, // Pending, Success, Failed, Cancelled
  description: String,
  category: String,
  method: String,
  hustle: String,
  reference: String
}
```

### Job
```javascript
{
  title: String,
  description: String,
  location: String,
  priceKes: Number,
  status: String, // pending, inProgress, completed, paid, cancelled
  postedBy: String,
  assignedTo: String,
  category: String,
  urgency: String,
  estimatedDuration: Number,
  requirements: [String],
  images: [String],
  rating: Number,
  review: String
}
```

### SavingsGoal
```javascript
{
  userId: String,
  name: String,
  target: Number,
  saved: Number,
  dueDate: Date,
  hustle: String,
  category: String,
  isActive: Boolean,
  completedAt: Date
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment (development/production) | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/jashoo |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRE` | JWT expiration time | 7d |
| `MAX_FILE_SIZE` | Max file upload size | 5242880 |
| `UPLOAD_PATH` | File upload directory | uploads/ |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |
| `CORS_ORIGIN` | CORS allowed origins | http://localhost:3000,http://localhost:8080 |

## Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with nodemon |
| `npm run init-db` | Initialize database with default data |
| `npm test` | Run tests |

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs with salt rounds
- **Rate Limiting**: Prevent API abuse
- **CORS Protection**: Configured for specific origins
- **Helmet**: Security headers
- **Input Validation**: Comprehensive request validation
- **PIN Security**: Transaction PIN with attempt limiting

## Error Handling

The API uses consistent error response format:

```javascript
{
  "success": false,
  "message": "Error description",
  "errors": [ // Optional validation errors
    {
      "field": "fieldName",
      "message": "Validation message",
      "value": "invalidValue"
    }
  ]
}
```

## Development

### Project Structure
```
backend/
├── models/           # MongoDB schemas
├── routes/           # API route handlers
├── middleware/       # Custom middleware
├── scripts/          # Database initialization
├── uploads/          # File uploads directory
├── server.js         # Main server file
├── package.json      # Dependencies and scripts
└── README.md         # This file
```

### Adding New Features

1. Create/update models in `models/`
2. Add validation rules in `middleware/validation.js`
3. Create route handlers in `routes/`
4. Update API documentation

### Testing

```bash
npm test
```

## Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET`
- [ ] Configure production MongoDB URI
- [ ] Set up proper CORS origins
- [ ] Configure rate limiting
- [ ] Set up file upload limits
- [ ] Enable HTTPS
- [ ] Set up monitoring and logging

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team

---

**Jashoo Backend API** - Empowering gig economy workers in Kenya with financial technology.