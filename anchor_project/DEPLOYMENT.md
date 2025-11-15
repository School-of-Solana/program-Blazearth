# Deployment Guide

This guide provides step-by-step instructions for deploying the Solana Instagram MVP to devnet and Vercel.

## Prerequisites

Before deploying, ensure you have:

- ✅ Solana CLI installed and configured
- ✅ Anchor CLI installed (v0.32.1)
- ✅ A Solana wallet with devnet SOL
- ✅ Node.js and npm/yarn installed
- ✅ Vercel account (for frontend deployment)

## Part 1: Deploy Smart Contract to Devnet

### Step 1: Configure Solana CLI for Devnet

```bash
# Set cluster to devnet
solana config set --url devnet

# Verify configuration
solana config get
```

Expected output:

```
Config File: ~/.config/solana/cli/config.yml
RPC URL: https://api.devnet.solana.com
WebSocket URL: wss://api.devnet.solana.com/ (computed)
Keypair Path: ~/.config/solana/id.json
Commitment: confirmed
```

### Step 2: Check Wallet Balance

```bash
# View your wallet address
solana address

# Check balance
solana balance
```

### Step 3: Get Devnet SOL

If your balance is low, request an airdrop:

```bash
# Request 2 SOL (may need to run multiple times)
solana airdrop 2

# Verify balance
solana balance
```

**Note**: Devnet faucet may have rate limits. If airdrop fails:

- Wait a few minutes and try again
- Use the [Solana Faucet](https://faucet.solana.com/) web interface
- Request smaller amounts (1 SOL at a time)

### Step 4: Build the Program

```bash
# Clean previous builds (optional)
anchor clean

# Build the program
anchor build
```

This should complete without errors. The compiled program will be at:
`target/deploy/social_app.so`

### Step 5: Deploy to Devnet

```bash
# Deploy the program
anchor deploy --provider.cluster devnet
```

**Expected Output**:

```
Deploying cluster: https://api.devnet.solana.com
Upgrade authority: /home/user/.config/solana/id.json
Deploying program "social_app"...
Program path: /home/user/social-app/target/deploy/social_app.so...
Program Id: 6t5PjEe4SW7JbtHxbttwZ9gyGGmLhahA9r2v2E3iPTsZ

Deploy success
```

**Save your Program ID!** You'll need it for the frontend configuration.

### Step 6: Verify Deployment

```bash
# Check program account
solana program show <YOUR_PROGRAM_ID> --url devnet
```

This should display program information including:

- Program ID
- Owner
- ProgramData Address
- Authority
- Last Deployed Slot
- Data Length
- Balance

## Part 2: Update Frontend Configuration

### Step 1: Update Program ID

Edit `app/src/utils/anchor.ts`:

```typescript
export const PROGRAM_ID = new PublicKey("YOUR_DEPLOYED_PROGRAM_ID");
export const NETWORK = "https://api.devnet.solana.com";
```

Replace `YOUR_DEPLOYED_PROGRAM_ID` with the program ID from deployment.

### Step 2: Regenerate IDL (if needed)

If you made changes to the program:

```bash
# Generate new IDL
anchor build

# Copy IDL to frontend
cp target/idl/social_app.json app/src/idl/
```

### Step 3: Test Locally

```bash
cd app
npm run dev
```

Visit `http://localhost:5173` and test:

1. Connect wallet (ensure wallet is on devnet)
2. Create profile
3. Create a post
4. Like and comment

## Part 3: Deploy Frontend to Vercel

### Option A: Deploy via Vercel CLI

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Login to Vercel

```bash
vercel login
```

Follow the prompts to authenticate.

#### Step 3: Deploy

```bash
# From project root
vercel
```

Follow the prompts:

- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- Project name? **solana-instagram-mvp** (or your choice)
- In which directory is your code located? **.**

Vercel will:

1. Build the project using settings from `vercel.json`
2. Deploy to a preview URL
3. Provide a production URL

#### Step 4: Deploy to Production

```bash
vercel --prod
```

### Option B: Deploy via Vercel Dashboard

#### Step 1: Push to Git

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

#### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your Git repository
4. Vercel will auto-detect settings from `vercel.json`
5. Click "Deploy"

### Step 3: Configure Environment (if needed)

If you need environment variables:

1. Go to Project Settings → Environment Variables
2. Add variables:
   - `VITE_PROGRAM_ID`: Your program ID
   - `VITE_NETWORK`: `devnet`

### Step 4: Verify Deployment

Visit your Vercel URL and test:

1. Wallet connection
2. Profile creation
3. Post creation
4. Social interactions

## Part 4: Update Documentation

### Update README.md

Add your deployment information:

```markdown
**Current Devnet Program ID**: `YOUR_PROGRAM_ID`
**Frontend URL**: `https://your-app.vercel.app`
```

### Share Your App

Your app is now live! Share the Vercel URL with others.

**Important**: Users will need:

- A Solana wallet (Phantom, Solflare, etc.)
- Wallet configured for devnet
- Devnet SOL (can get from faucet)

## Troubleshooting

### Deployment Fails: Insufficient Funds

**Error**: `Account has insufficient funds for spend`

**Solution**:

```bash
# Check balance
solana balance

# Get more SOL
solana airdrop 2

# If airdrop fails, use web faucet
# Visit: https://faucet.solana.com/
```

### Deployment Fails: Program Already Deployed

**Error**: `Error: Program already deployed`

**Solution**:

```bash
# Upgrade existing program
anchor upgrade target/deploy/social_app.so --program-id <YOUR_PROGRAM_ID> --provider.cluster devnet
```

### Frontend Build Fails

**Error**: Module not found or build errors

**Solution**:

```bash
cd app
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Wallet Connection Issues

**Problem**: Wallet won't connect on deployed site

**Solution**:

1. Ensure wallet is set to devnet
2. Check browser console for errors
3. Verify CORS settings (Vercel handles this automatically)
4. Try different wallet (Phantom, Solflare)

### Program ID Mismatch

**Error**: `Program ID mismatch` or transactions fail

**Solution**:

1. Verify `PROGRAM_ID` in `app/src/utils/anchor.ts`
2. Ensure it matches deployed program
3. Rebuild frontend: `npm run build`
4. Redeploy to Vercel

## Monitoring and Maintenance

### Check Program Status

```bash
# View program info
solana program show <PROGRAM_ID> --url devnet

# View recent transactions
solana transaction-history <PROGRAM_ID> --url devnet
```

### View Logs

```bash
# During testing
anchor test -- --nocapture

# View Solana logs
solana logs <PROGRAM_ID> --url devnet
```

### Update Program

When you make changes:

```bash
# Build new version
anchor build

# Upgrade program
anchor upgrade target/deploy/social_app.so --program-id <YOUR_PROGRAM_ID> --provider.cluster devnet

# Update frontend
cd app
npm run build
vercel --prod
```

## Cost Considerations

### Devnet (Free)

- All transactions are free
- SOL is obtained from faucet
- Perfect for testing and development

### Mainnet (Future)

If deploying to mainnet:

- Program deployment: ~2-5 SOL
- Account rent: Varies by account size
- Transaction fees: ~0.000005 SOL per transaction
- Consider rent-exempt minimums for accounts

## Security Checklist

Before mainnet deployment:

- [ ] Audit smart contract code
- [ ] Test all edge cases
- [ ] Verify PDA derivations
- [ ] Check account size limits
- [ ] Test with multiple wallets
- [ ] Implement rate limiting (frontend)
- [ ] Add monitoring and alerts
- [ ] Set up upgrade authority properly
- [ ] Document emergency procedures
- [ ] Consider bug bounty program

## Next Steps

After successful deployment:

1. **Test thoroughly**: Create multiple profiles, posts, and interactions
2. **Gather feedback**: Share with friends and collect user feedback
3. **Monitor usage**: Watch for errors or unexpected behavior
4. **Iterate**: Make improvements based on feedback
5. **Document issues**: Keep track of bugs and feature requests

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review [Anchor Documentation](https://www.anchor-lang.com/)
3. Check [Solana Stack Exchange](https://solana.stackexchange.com/)
4. Review program logs: `solana logs <PROGRAM_ID> --url devnet`

---

Congratulations! Your Solana Instagram MVP is now deployed and accessible to users worldwide! 🎉
