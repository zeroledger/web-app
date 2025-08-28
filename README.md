# ZeroLedger Web App

A privacy-focused Web3 application built with React, TypeScript, and Viem for secure blockchain interactions. ZeroLedger provides a modern interface for managing private transactions and wallet operations.

## Features

- 🔐 **Privacy-First**: Zero-knowledge proof-based transactions
- 💳 **Wallet Management**: Secure wallet operations with Privy integration
- 💰 **Transaction Support**: Deposit, spend, and withdraw functionality
- 📱 **Mobile-First**: Responsive design optimized for mobile devices
- 🔄 **Real-time Sync**: Live ledger synchronization
- 🎨 **Modern UI**: Built with Tailwind CSS and Framer Motion

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS 4, Framer Motion
- **Web3**: Viem, Privy Authentication
- **Cryptography**: SnarkJS, CircomlibJS, Poseidon
- **State Management**: SWR, React Context
- **Testing**: Vitest

## Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

## Installation

```bash
npm install
```

## Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to view the application.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests with Vitest
- `npm run prettier` - Format code with Prettier

## Project Structure

```
src/
├── assets/             # Static app data, aka zk keys & wasm modules
├── components/         # React components, component scoped context providers & hooks
├── context/            # App context providers
├── hooks/              # App global hooks
├── services/           # Business logic and API services
├── utils/              # Utility functions
└── routes/             # Application routing
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/zeroledger/web-app/issues)
- **Repository**: [GitHub Repository](https://github.com/zeroledger/web-app)
