# TokenMinting - Blockchain-Based Token Distribution System

A decentralized application (dApp) for secure and transparent token distribution in democratic voting processes, built on the Solana blockchain.

## Features

- Secure token distribution system
- Integration with Solana blockchain
- Real-time transaction monitoring
- User-friendly web interface
- Automated distribution process

## Tech Stack

- **Frontend**: React.js
- **Backend**: Node.js
- **Blockchain**: Solana
- **Database**: MongoDB
- **Containerization**: Docker
- **CI/CD**: GitHub Actions

## Setup

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd TokenMinting
   ```

2. **Environment Setup**
   ```bash
   # Backend setup
   cd backend
   cp .env.example .env
   npm install

   # Frontend setup
   cd ../frontend
   cp .env.example .env
   npm install
   ```

3. **Docker Deployment**
   ```bash
   cd ../backend
   docker-compose up --build
   ```

## Configuration

Configure the following environment variables:
- `MONGODB_URI`: MongoDB connection string
- `SOLANA_NETWORK`: Solana network (devnet/mainnet)
- `SOLANA_RPC_URL`: Solana RPC endpoint
- `SECRET_KEY`: Your private key

## Usage

1. Access the frontend at `http://localhost:3001`
2. Connect your Solana wallet
3. Follow the interface prompts for token distribution

## Security

- Secure key management
- Rate limiting
- Input validation
- Transaction verification

## License

MIT License - See LICENSE file for details

## 👥 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.