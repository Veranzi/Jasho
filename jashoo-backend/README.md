# Jashoo Backend - Advanced Financial Services API

A comprehensive, enterprise-grade backend API for the Jashoo financial services application, featuring advanced cybersecurity, blockchain integration, AI-powered credit scoring, voice-enabled chatbot, and geographic heatmaps for gig economy workers in Kenya.

## 🌟 Features

### 🔐 Advanced Cybersecurity
- **Balance Masking**: Dynamic balance masking to prevent shoulder surfing
- **Transaction Security**: Multi-layer PIN protection with attempt limiting
- **Document Scanning**: AI-powered malware detection and QR code validation
- **Advanced Rate Limiting**: Tiered rate limiting based on endpoint sensitivity
- **Request Fingerprinting**: Device fingerprinting for fraud detection
- **Security Audit Logging**: Comprehensive security event logging

### ⛓️ Blockchain Integration
- **Multi-Chain Support**: Ethereum, Polygon, Binance Smart Chain
- **Smart Contracts**: All transactions recorded on blockchain
- **Cross-Chain Transactions**: Bridge support for multi-chain operations
- **Private Key Security**: Secure key management and rotation
- **Transaction Verification**: Real-time blockchain verification

### 🤖 AI-Powered Credit Scoring
- **Machine Learning Model**: TensorFlow-based neural network
- **Real-time Scoring**: Instant credit score calculation (300-850 range)
- **Pattern Analysis**: Income, spending, and payment pattern analysis
- **Predictive Analytics**: Income forecasting and risk assessment
- **Financial Health Scoring**: Comprehensive financial wellness analysis

### 🎤 Voice-Enabled Chatbot
- **Speech Processing**: OpenAI Whisper for voice input
- **Text-to-Speech**: Natural voice response generation
- **Responsible AI**: Content filtering and safety checks
- **Bilingual Support**: English and Swahili voice processing
- **Financial Expertise**: Contextual financial advice

### 🗺️ Geographic Heatmap
- **Real-time Data**: Live job posting visualization
- **Category Colors**: Different colors for job types (Boda Boda, Mama Fua, etc.)
- **Interactive Features**: Zoom, filters, time ranges
- **Trend Analysis**: Hot spots and trending locations
- **Market Intelligence**: Competition and pricing analysis

### 📊 Advanced Analytics
- **User Behavior Analysis**: Spending patterns and income analysis
- **Predictive Analytics**: Financial forecasting and trend prediction
- **Risk Assessment**: Automated risk factor identification
- **Personalized Recommendations**: AI-driven financial suggestions
- **Market Trends**: Real-time market analysis

### 🛡️ Data Protection & Privacy
- **GDPR Compliance**: Complete data protection compliance
- **End-to-End Encryption**: AES-256 encryption for all sensitive data
- **Privacy Controls**: User privacy dashboard and controls
- **Data Anonymization**: Personal data anonymization for AI processing
- **Audit Trails**: Complete access and modification logging

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- MongoDB 4.4 or higher
- Redis (optional but recommended)
- npm or yarn

### Installation

1. **Clone and navigate to the backend directory**:
   ```bash
   cd jashoo-backend
   ```

2. **Run the automated setup script**:
   ```bash
   ./setup.sh
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## 📋 API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login user | No |
| POST | `/verify-email` | Verify email address | No |
| POST | `/verify-phone` | Verify phone number | No |
| POST | `/resend-email-verification` | Resend email verification | Yes |
| POST | `/resend-phone-verification` | Resend phone verification | Yes |
| GET | `/me` | Get current user profile | Yes |
| POST | `/refresh` | Refresh JWT token | Yes |
| POST | `/logout` | Logout user | Yes |
| POST | `/forgot-password` | Request password reset | No |
| POST | `/reset-password` | Reset password | No |
| POST | `/change-password` | Change password | Yes |
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
| GET | `/balance` | Get wallet balance (masked) | Yes |
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

### AI Insights (`/api/ai`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/suggestions` | Get AI suggestions | Yes |
| GET | `/insights` | Get financial insights | Yes |
| GET | `/market-trends` | Get market trends | Yes |

### Chatbot (`/api/chatbot`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/chat` | Send text message | Yes |
| POST | `/voice-chat` | Send voice message | Yes |
| POST | `/analyze-image` | Analyze uploaded image | Yes |
| GET | `/history` | Get chat history | Yes |

### Heatmap (`/api/heatmap`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/jobs` | Get job heatmap data | Optional |
| GET | `/density` | Get job density by area | Optional |
| GET | `/categories` | Get category distribution | Optional |
| GET | `/trending` | Get trending areas | Optional |

### Credit Score (`/api/credit-score`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/score` | Get credit score | Yes |
| GET | `/analysis` | Get detailed analysis | Yes |
| GET | `/history` | Get score history | Yes |
| POST | `/recalculate` | Force recalculation | Yes |
| GET | `/eligibility` | Get loan eligibility | Yes |
| GET | `/factors` | Get credit factors | Yes |
| GET | `/comparison` | Get peer comparison | Yes |

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment (development/production) | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/jashoo |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRE` | JWT expiration time | 7d |
| `SESSION_SECRET` | Session secret | Required |
| `BALANCE_ENCRYPTION_KEY` | Balance encryption key | Required |
| `CONTRACT_SALT` | Contract salt | Required |
| `MAX_FILE_SIZE` | Max file upload size | 10485760 |
| `UPLOAD_PATH` | File upload directory | uploads/ |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |
| `CORS_ORIGIN` | CORS allowed origins | http://localhost:3000 |
| `ETHEREUM_RPC_URL` | Ethereum RPC URL | Required for blockchain |
| `POLYGON_RPC_URL` | Polygon RPC URL | Required for blockchain |
| `BSC_RPC_URL` | BSC RPC URL | Required for blockchain |
| `JASHOO_CONTRACT_ADDRESS` | Smart contract address | Required for blockchain |
| `OPENAI_API_KEY` | OpenAI API key | Required for AI features |
| `REDIS_URL` | Redis connection string | redis://localhost:6379 |
| `SECURITY_MONITORING_ENABLED` | Enable security monitoring | true |
| `THREAT_DETECTION_ENABLED` | Enable threat detection | true |
| `AI_ENABLED` | Enable AI features | true |
| `BLOCKCHAIN_ENABLED` | Enable blockchain features | true |

### Security Configuration

```bash
# Generate secure secrets
JWT_SECRET=$(openssl rand -base64 64)
SESSION_SECRET=$(openssl rand -base64 64)
BALANCE_ENCRYPTION_KEY=$(openssl rand -base64 64)
CONTRACT_SALT=$(openssl rand -base64 64)
```

## 🛠️ Development

### Project Structure
```
jashoo-backend/
├── models/              # Database schemas
│   ├── User.js          # User management
│   ├── Wallet.js        # Wallet & transactions
│   ├── Job.js           # Job marketplace
│   ├── Savings.js       # Savings goals & loans
│   ├── CreditScore.js   # AI credit scoring
│   └── Gamification.js  # Points, badges, levels
├── routes/              # API route handlers
│   ├── auth.js          # Authentication
│   ├── user.js          # User management
│   ├── wallet.js        # Wallet operations
│   ├── jobs.js          # Job marketplace
│   ├── savings.js       # Savings & loans
│   ├── gamification.js  # Gamification system
│   ├── ai.js            # AI insights
│   ├── chatbot.js       # Voice-enabled chatbot
│   ├── heatmap.js       # Geographic heatmap
│   └── credit-score.js  # AI credit scoring
├── middleware/          # Custom middleware
│   ├── auth.js          # JWT authentication
│   ├── cybersecurity.js # Advanced security
│   ├── blockchain.js    # Blockchain integration
│   └── validation.js    # Request validation
├── scripts/             # Database utilities
│   ├── init-db.js       # Database initialization
│   └── security-audit.js # Security audit tool
├── uploads/             # File uploads directory
├── logs/                # Log files directory
├── server.js            # Main server file
├── package.json         # Dependencies
├── .env.example         # Environment template
├── .env                 # Environment config
├── setup.sh             # Setup script
└── README.md            # This file
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with nodemon |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run init-db` | Initialize database with default data |
| `npm run security-audit` | Run comprehensive security audit |
| `npm run blockchain-init` | Initialize blockchain contracts |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run format` | Format code with Prettier |

### Adding New Features

1. **Create/update models** in `models/`
2. **Add validation rules** in `middleware/validation.js`
3. **Create route handlers** in `routes/`
4. **Update API documentation**

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong secrets (JWT_SECRET, SESSION_SECRET, etc.)
- [ ] Configure production MongoDB URI
- [ ] Set up proper CORS origins
- [ ] Configure rate limiting
- [ ] Set up file upload limits
- [ ] Enable HTTPS
- [ ] Set up monitoring and logging
- [ ] Configure reverse proxy (nginx/apache)
- [ ] Set up SSL certificates
- [ ] Configure firewall rules

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Systemd Service (Linux)

```bash
# Enable and start service
sudo systemctl enable jashoo-backend
sudo systemctl start jashoo-backend

# View logs
sudo journalctl -u jashoo-backend -f
```

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Multi-factor authentication support
- Role-based access control
- Session management with secure cookies

### Data Protection
- AES-256 encryption for sensitive data
- Balance masking in API responses
- PIN-based transaction security
- Secure key management

### Threat Detection
- Real-time threat monitoring
- Anomaly detection
- Fraud prevention
- Security event logging

### Input Validation
- Comprehensive input sanitization
- SQL injection prevention
- XSS protection
- File upload security

## 📊 Monitoring & Analytics

### Health Monitoring
- Health check endpoint (`/health`)
- Performance metrics
- Error tracking
- Uptime monitoring

### Security Monitoring
- Security event logging
- Threat detection alerts
- Audit trail maintenance
- Compliance reporting

### Business Analytics
- User behavior analysis
- Transaction analytics
- Financial insights
- Market trends

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines

- Follow ESLint configuration
- Write comprehensive tests
- Document new features
- Maintain security standards
- Follow semantic versioning

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation
- Review the API reference

## 🎯 Roadmap

### Upcoming Features
- [ ] Advanced fraud detection
- [ ] Machine learning model improvements
- [ ] Additional blockchain networks
- [ ] Enhanced voice processing
- [ ] Real-time notifications
- [ ] Advanced analytics dashboard

### Performance Improvements
- [ ] Database optimization
- [ ] Caching strategies
- [ ] API response optimization
- [ ] Load balancing
- [ ] Microservices architecture

---

**Jashoo Backend** - Empowering gig economy workers in Kenya with advanced financial technology, featuring enterprise-grade security, blockchain integration, and AI-powered insights.

Built with ❤️ for the African gig economy.