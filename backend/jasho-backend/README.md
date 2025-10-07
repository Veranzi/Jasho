# Jasho Backend

## Overview
Jasho Backend is a Node.js application built with TypeScript and Express. It serves as the backend for the Jasho project, providing APIs for user management and authentication.

## Features
- User registration and authentication
- RESTful API for user-related operations
- Middleware for authentication checks
- Database integration using Prisma
- Logging utility for error tracking

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm (Node Package Manager)
- Docker (optional, for containerization)

### Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   cd jasho-backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` and fill in the required values.

### Running the Application
To start the application, run:
```
npm start
```

### Running Tests
To run the unit tests, use:
```
npm test
```

### Database Seeding
To seed the database with initial data, run:
```
npm run seed
```

## Directory Structure
```
jasho-backend
├── src                  # Source code
│   ├── index.ts        # Entry point of the application
│   ├── server.ts       # Express server setup
│   ├── config           # Configuration settings
│   ├── controllers      # User-related request handlers
│   ├── routes           # Application routes
│   ├── services         # Authentication services
│   ├── models           # User model
│   ├── middlewares      # Authentication middleware
│   ├── repositories      # User database operations
│   ├── utils            # Utility functions
│   └── types            # TypeScript types and interfaces
├── tests                # Unit tests
├── scripts              # Database seeding scripts
├── prisma               # Prisma schema
├── .env.example         # Example environment variables
├── .gitignore           # Git ignore file
├── Dockerfile           # Docker image instructions
├── docker-compose.yml   # Docker services configuration
├── package.json         # npm configuration
└── tsconfig.json        # TypeScript configuration
```

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.