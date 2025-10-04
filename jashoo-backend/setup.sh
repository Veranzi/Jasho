#!/bin/bash

# Jashoo Backend Complete Setup Script
# This script sets up the complete backend with all advanced features

echo "🚀 Setting up Jashoo Backend with Advanced Features..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Check if Node.js is installed
check_node() {
    print_header "Checking Node.js Installation"
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        echo "Visit: https://nodejs.org/en/download/"
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        echo "Please upgrade Node.js to version 18 or higher"
        exit 1
    fi

    print_status "Node.js $(node -v) detected ✓"
}

# Check if MongoDB is running
check_mongodb() {
    print_header "Checking MongoDB Installation"
    
    if ! command -v mongod &> /dev/null; then
        print_warning "MongoDB is not installed. Please install MongoDB first."
        echo "Visit: https://docs.mongodb.com/manual/installation/"
        echo "Or use Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest"
        read -p "Continue without MongoDB? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        # Check if MongoDB is running
        if ! pgrep -x "mongod" > /dev/null; then
            print_warning "MongoDB is not running. Please start MongoDB first."
            echo "Run: sudo systemctl start mongod (Linux) or brew services start mongodb (macOS)"
            echo "Or use Docker: docker start mongodb"
            read -p "Continue without MongoDB? (y/n): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        else
            print_status "MongoDB is running ✓"
        fi
    fi
}

# Check if Redis is running
check_redis() {
    print_header "Checking Redis Installation"
    
    if ! command -v redis-server &> /dev/null; then
        print_warning "Redis is not installed. Some features may not work optimally."
        echo "Visit: https://redis.io/download"
        echo "Or use Docker: docker run -d -p 6379:6379 --name redis redis:latest"
    else
        if ! pgrep -x "redis-server" > /dev/null; then
            print_warning "Redis is not running. Some features may not work optimally."
            echo "Run: sudo systemctl start redis (Linux) or brew services start redis (macOS)"
            echo "Or use Docker: docker start redis"
        else
            print_status "Redis is running ✓"
        fi
    fi
}

# Install dependencies
install_dependencies() {
    print_header "Installing Dependencies"
    
    print_status "Installing npm packages..."
    npm install
    
    if [ $? -ne 0 ]; then
        print_error "Failed to install dependencies"
        exit 1
    fi

    print_status "Dependencies installed successfully ✓"
}

# Create necessary directories
create_directories() {
    print_header "Creating Directories"
    
    directories=(
        "uploads"
        "uploads/chatbot"
        "uploads/documents"
        "uploads/images"
        "logs"
        "backups"
        "models"
        "scripts"
    )
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_status "Created directory: $dir"
        else
            print_status "Directory already exists: $dir"
        fi
    done
}

# Set up environment file
setup_environment() {
    print_header "Setting up Environment Configuration"
    
    if [ ! -f .env ]; then
        cp .env.example .env
        print_status "Created .env file from template"
        print_warning "Please edit .env file with your configuration"
    else
        print_status ".env file already exists"
    fi
    
    # Generate secure secrets if not set
    if grep -q "your-super-secret-jwt-key-change-this-in-production" .env; then
        JWT_SECRET=$(openssl rand -base64 64)
        SESSION_SECRET=$(openssl rand -base64 64)
        BALANCE_ENCRYPTION_KEY=$(openssl rand -base64 64)
        CONTRACT_SALT=$(openssl rand -base64 64)
        
        sed -i "s/your-super-secret-jwt-key-change-this-in-production/$JWT_SECRET/g" .env
        sed -i "s/your-session-secret-key-change-this-in-production/$SESSION_SECRET/g" .env
        sed -i "s/your-balance-encryption-key-change-this/$BALANCE_ENCRYPTION_KEY/g" .env
        sed -i "s/your-contract-salt-change-this/$CONTRACT_SALT/g" .env
        
        print_status "Generated secure secrets ✓"
    fi
}

# Initialize database
initialize_database() {
    print_header "Initializing Database"
    
    print_status "Running database initialization..."
    npm run init-db
    
    if [ $? -ne 0 ]; then
        print_warning "Database initialization failed, but continuing..."
    else
        print_status "Database initialized successfully ✓"
    fi
}

# Run security audit
run_security_audit() {
    print_header "Running Security Audit"
    
    print_status "Running comprehensive security audit..."
    npm run security-audit
    
    if [ $? -ne 0 ]; then
        print_warning "Security audit found issues, but continuing..."
    else
        print_status "Security audit passed ✓"
    fi
}

# Run tests
run_tests() {
    print_header "Running Tests"
    
    print_status "Running test suite..."
    npm test
    
    if [ $? -ne 0 ]; then
        print_warning "Some tests failed, but continuing..."
    else
        print_status "All tests passed ✓"
    fi
}

# Set up file permissions
setup_permissions() {
    print_header "Setting up File Permissions"
    
    # Make scripts executable
    chmod +x scripts/*.js
    chmod +x setup.sh
    
    # Set proper permissions for uploads directory
    chmod 755 uploads
    chmod 755 logs
    
    print_status "File permissions set ✓"
}

# Create systemd service file (Linux)
create_systemd_service() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        print_header "Creating Systemd Service"
        
        SERVICE_FILE="/etc/systemd/system/jashoo-backend.service"
        
        if [ ! -f "$SERVICE_FILE" ]; then
            sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=Jashoo Backend API
After=network.target mongodb.service redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=$(pwd)/.env

[Install]
WantedBy=multi-user.target
EOF
            
            print_status "Systemd service created ✓"
            print_status "To enable: sudo systemctl enable jashoo-backend"
            print_status "To start: sudo systemctl start jashoo-backend"
        else
            print_status "Systemd service already exists"
        fi
    fi
}

# Create Docker configuration
create_docker_config() {
    print_header "Creating Docker Configuration"
    
    if [ ! -f "Dockerfile" ]; then
        cat > Dockerfile <<EOF
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S jashoo -u 1001

# Change ownership
RUN chown -R jashoo:nodejs /app
USER jashoo

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["node", "server.js"]
EOF
        print_status "Dockerfile created ✓"
    fi
    
    if [ ! -f "docker-compose.yml" ]; then
        cat > docker-compose.yml <<EOF
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    depends_on:
      - mongodb
      - redis
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    restart: unless-stopped

  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  mongodb_data:
  redis_data:
EOF
        print_status "Docker Compose file created ✓"
    fi
}

# Create health check script
create_healthcheck() {
    print_header "Creating Health Check Script"
    
    cat > healthcheck.js <<EOF
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/health',
  method: 'GET',
  timeout: 2000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => {
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});

req.end();
EOF
    
    print_status "Health check script created ✓"
}

# Main setup function
main() {
    print_header "Jashoo Backend Complete Setup"
    print_status "Setting up advanced financial services backend with cybersecurity, blockchain, and AI features"
    
    # Run all setup steps
    check_node
    check_mongodb
    check_redis
    install_dependencies
    create_directories
    setup_environment
    setup_permissions
    initialize_database
    run_security_audit
    run_tests
    create_docker_config
    create_healthcheck
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        create_systemd_service
    fi
    
    print_header "Setup Complete! 🎉"
    
    echo ""
    print_status "Next steps:"
    echo "1. Edit .env file with your API keys and configuration"
    echo "2. Start the development server: npm run dev"
    echo "3. API will be available at: http://localhost:3000"
    echo "4. Health check: http://localhost:3000/health"
    echo "5. API documentation: http://localhost:3000/api-docs"
    echo ""
    print_status "Available commands:"
    echo "• npm run dev          # Start development server"
    echo "• npm start            # Start production server"
    echo "• npm test             # Run tests"
    echo "• npm run init-db      # Reinitialize database"
    echo "• npm run security-audit # Run security audit"
    echo "• npm run blockchain-init # Initialize blockchain"
    echo ""
    print_status "Docker commands:"
    echo "• docker-compose up -d # Start with Docker"
    echo "• docker-compose down  # Stop Docker services"
    echo ""
    print_status "Production deployment:"
    echo "• Configure your reverse proxy (nginx/apache)"
    echo "• Set up SSL certificates"
    echo "• Configure firewall rules"
    echo "• Set up monitoring and logging"
    echo ""
    print_status "Features included:"
    echo "• 🔐 Advanced cybersecurity with balance masking"
    echo "• ⛓️ Blockchain integration for all transactions"
    echo "• 🤖 AI-powered credit scoring and insights"
    echo "• 🎤 Voice-enabled chatbot with responsible AI"
    echo "• 🗺️ Geographic heatmap for job visualization"
    echo "• 📊 Comprehensive analytics and reporting"
    echo "• 🛡️ GDPR-compliant data protection"
    echo "• 📱 Multi-platform support (web, mobile)"
    echo ""
    print_status "Happy coding! 🚀"
}

# Run main function
main "$@"