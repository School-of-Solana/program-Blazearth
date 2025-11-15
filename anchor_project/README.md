# Social App - Anchor Project

This is the Solana program (smart contract) for the Social App, built using the Anchor framework.

## Program ID

```
6t5PjEe4SW7JbtHxbttwZ9gyGGmLhahA9r2v2E3iPTsZ
```

## Structure

```
anchor_project/
├── programs/social-app/    # Solana program source code
├── tests/                  # TypeScript tests
├── migrations/             # Deployment scripts
├── Anchor.toml            # Anchor configuration
└── Cargo.toml             # Rust dependencies
```

## Building

```bash
anchor build
```

## Testing

```bash
anchor test
```

## Deployment

The program is already deployed to Devnet. To redeploy:

```bash
anchor deploy --provider.cluster devnet
```

## Documentation

- See `programs/social-app/README.md` for detailed program structure
- See `DEPLOYMENT.md` for deployment guide
- See `PDA_GUIDE.md` for PDA implementation details
