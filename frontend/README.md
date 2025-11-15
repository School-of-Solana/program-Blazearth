# Social App - Frontend

React + TypeScript frontend for the Solana Social App.

## Features

- Wallet connection (Phantom, Solflare, etc.)
- Profile creation and management
- Post creation with IPFS integration
- Like and comment functionality
- Feed view with all posts
- Dark/Light theme toggle

## Tech Stack

- React 18
- TypeScript
- Vite
- Solana Web3.js
- Anchor
- Solana Wallet Adapter

## Development

```bash
# Install dependencies
yarn install

# Run development server
yarn dev

# Build for production
yarn build
```

## Environment

The app connects to Solana Devnet by default. Program ID is configured in `src/utils/anchor.ts`.

## Deployment

Deploy to Vercel or your preferred hosting provider:

```bash
yarn build
# Upload dist/ folder to your hosting service
```
