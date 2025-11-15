# Program Derived Addresses (PDA) Guide

This document explains how PDAs are used in the Solana Instagram MVP and provides practical examples for developers.

## What are PDAs?

Program Derived Addresses (PDAs) are deterministic addresses derived from:

1. A set of seeds (byte arrays)
2. A program ID

PDAs allow programs to "own" accounts and sign transactions programmatically without requiring a private key.

## Why Use PDAs?

1. **Deterministic**: Same seeds always produce the same address
2. **No Private Key**: Programs can sign for PDA accounts
3. **Scalable**: Create unlimited accounts with different seeds
4. **Secure**: Only the program can sign for its PDAs

## PDA Architecture in This Project

### 1. Profile PDA

**Purpose**: Store user profile information

**Seeds**: `["profile", user_pubkey]`

**Structure**:

```rust
Profile {
    owner: Pubkey,        // User's wallet address
    username: String,     // Display name (max 32 chars)
    post_count: u64,      // Number of posts created
    bump: u8,             // PDA bump seed
}
```

**Derivation Example**:

```typescript
const [profilePDA, profileBump] = PublicKey.findProgramAddressSync(
  [Buffer.from("profile"), userPublicKey.toBuffer()],
  programId
);
```

**Why This Design?**

- One profile per wallet address
- Easy to find: just need user's public key
- No collisions: each user has unique address

### 2. Post PDA

**Purpose**: Store individual post data

**Seeds**: `["post", user_pubkey, post_index]`

**Structure**:

```rust
Post {
    owner: Pubkey,        // Profile that created this post
    index: u64,           // Post number (0, 1, 2, ...)
    metadata_uri: String, // IPFS link to image/metadata
    likes: u64,           // Like counter
    comment_count: u64,   // Number of comments
    timestamp: i64,       // Unix timestamp
    bump: u8,             // PDA bump seed
}
```

**Derivation Example**:

```typescript
const postIndex = 0; // First post
const indexBuffer = Buffer.alloc(8);
indexBuffer.writeBigUInt64LE(BigInt(postIndex));

const [postPDA, postBump] = PublicKey.findProgramAddressSync(
  [Buffer.from("post"), userPublicKey.toBuffer(), indexBuffer],
  programId
);
```

**Why This Design?**

- Multiple posts per user (indexed 0, 1, 2, ...)
- Sequential ordering for chronological feed
- Easy to find: need user's public key + post index
- Scalable: no limit on posts per user

### 3. Comment PDA

**Purpose**: Store comments on posts

**Seeds**: `["comment", post_pubkey, comment_index]`

**Structure**:

```rust
Comment {
    post: Pubkey,         // Post this comment belongs to
    commenter: Pubkey,    // User who wrote the comment
    comment_text: String, // Comment content (max 280 chars)
    index: u64,           // Comment number (0, 1, 2, ...)
    timestamp: i64,       // Unix timestamp
    bump: u8,             // PDA bump seed
}
```

**Derivation Example**:

```typescript
const commentIndex = 0; // First comment
const indexBuffer = Buffer.alloc(8);
indexBuffer.writeBigUInt64LE(BigInt(commentIndex));

const [commentPDA, commentBump] = PublicKey.findProgramAddressSync(
  [Buffer.from("comment"), postPublicKey.toBuffer(), indexBuffer],
  programId
);
```

**Why This Design?**

- Multiple comments per post (indexed 0, 1, 2, ...)
- Comments linked to specific post
- Sequential ordering for comment threads
- Easy to query all comments for a post

## PDA Relationships

```
User Wallet
    │
    └─── Profile PDA ["profile", user_pubkey]
            │
            ├─── Post PDA ["post", user_pubkey, 0]
            │       │
            │       ├─── Comment PDA ["comment", post_pubkey, 0]
            │       ├─── Comment PDA ["comment", post_pubkey, 1]
            │       └─── Comment PDA ["comment", post_pubkey, 2]
            │
            ├─── Post PDA ["post", user_pubkey, 1]
            │       │
            │       └─── Comment PDA ["comment", post_pubkey, 0]
            │
            └─── Post PDA ["post", user_pubkey, 2]
```

## Practical Examples

### Example 1: Create Profile

```typescript
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";

async function createProfile(
  program: Program,
  username: string,
  userWallet: PublicKey
) {
  // Derive Profile PDA
  const [profilePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("profile"), userWallet.toBuffer()],
    program.programId
  );

  // Call init_profile instruction
  const tx = await program.methods
    .initProfile(username)
    .accounts({
      profile: profilePDA,
      user: userWallet,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log("Profile created:", tx);
  return profilePDA;
}
```

### Example 2: Create Post

```typescript
import { SYSVAR_CLOCK_PUBKEY } from "@solana/web3.js";

async function createPost(
  program: Program,
  metadataUri: string,
  userWallet: PublicKey,
  postIndex: number
) {
  // Derive Profile PDA
  const [profilePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("profile"), userWallet.toBuffer()],
    program.programId
  );

  // Derive Post PDA
  const indexBuffer = Buffer.alloc(8);
  indexBuffer.writeBigUInt64LE(BigInt(postIndex));

  const [postPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("post"), userWallet.toBuffer(), indexBuffer],
    program.programId
  );

  // Call create_post instruction
  const tx = await program.methods
    .createPost(metadataUri)
    .accounts({
      post: postPDA,
      profile: profilePDA,
      user: userWallet,
      systemProgram: SystemProgram.programId,
      clock: SYSVAR_CLOCK_PUBKEY,
    })
    .rpc();

  console.log("Post created:", tx);
  return postPDA;
}
```

### Example 3: Fetch All Posts for a User

```typescript
async function getUserPosts(program: Program, userWallet: PublicKey) {
  // First, get the profile to know post count
  const [profilePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("profile"), userWallet.toBuffer()],
    program.programId
  );

  const profile = await program.account.profile.fetch(profilePDA);
  const postCount = profile.postCount.toNumber();

  // Fetch all posts
  const posts = [];
  for (let i = 0; i < postCount; i++) {
    const indexBuffer = Buffer.alloc(8);
    indexBuffer.writeBigUInt64LE(BigInt(i));

    const [postPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("post"), userWallet.toBuffer(), indexBuffer],
      program.programId
    );

    try {
      const post = await program.account.post.fetch(postPDA);
      posts.push({ address: postPDA, data: post });
    } catch (e) {
      console.log(`Post ${i} not found`);
    }
  }

  return posts;
}
```

### Example 4: Fetch All Comments for a Post

```typescript
async function getPostComments(program: Program, postPDA: PublicKey) {
  // Get post to know comment count
  const post = await program.account.post.fetch(postPDA);
  const commentCount = post.commentCount.toNumber();

  // Fetch all comments
  const comments = [];
  for (let i = 0; i < commentCount; i++) {
    const indexBuffer = Buffer.alloc(8);
    indexBuffer.writeBigUInt64LE(BigInt(i));

    const [commentPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("comment"), postPDA.toBuffer(), indexBuffer],
      program.programId
    );

    try {
      const comment = await program.account.comment.fetch(commentPDA);
      comments.push({ address: commentPDA, data: comment });
    } catch (e) {
      console.log(`Comment ${i} not found`);
    }
  }

  return comments;
}
```

## Helper Functions

Here are reusable helper functions for PDA derivation:

```typescript
// utils/pda.ts
import { PublicKey } from "@solana/web3.js";

export function getProfilePDA(
  userPubkey: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("profile"), userPubkey.toBuffer()],
    programId
  );
}

export function getPostPDA(
  userPubkey: PublicKey,
  postIndex: number,
  programId: PublicKey
): [PublicKey, number] {
  const indexBuffer = Buffer.alloc(8);
  indexBuffer.writeBigUInt64LE(BigInt(postIndex));

  return PublicKey.findProgramAddressSync(
    [Buffer.from("post"), userPubkey.toBuffer(), indexBuffer],
    programId
  );
}

export function getCommentPDA(
  postPubkey: PublicKey,
  commentIndex: number,
  programId: PublicKey
): [PublicKey, number] {
  const indexBuffer = Buffer.alloc(8);
  indexBuffer.writeBigUInt64LE(BigInt(commentIndex));

  return PublicKey.findProgramAddressSync(
    [Buffer.from("comment"), postPubkey.toBuffer(), indexBuffer],
    programId
  );
}
```

## Common Patterns

### Pattern 1: Check if Account Exists

```typescript
async function profileExists(
  program: Program,
  userWallet: PublicKey
): Promise<boolean> {
  const [profilePDA] = getProfilePDA(userWallet, program.programId);

  try {
    await program.account.profile.fetch(profilePDA);
    return true;
  } catch {
    return false;
  }
}
```

### Pattern 2: Get or Create Pattern

```typescript
async function getOrCreateProfile(
  program: Program,
  username: string,
  userWallet: PublicKey
) {
  const [profilePDA] = getProfilePDA(userWallet, program.programId);

  try {
    // Try to fetch existing profile
    const profile = await program.account.profile.fetch(profilePDA);
    return { pda: profilePDA, data: profile, created: false };
  } catch {
    // Profile doesn't exist, create it
    await program.methods
      .initProfile(username)
      .accounts({
        profile: profilePDA,
        user: userWallet,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const profile = await program.account.profile.fetch(profilePDA);
    return { pda: profilePDA, data: profile, created: true };
  }
}
```

### Pattern 3: Batch Fetch with getProgramAccounts

```typescript
async function getAllProfiles(program: Program) {
  const profiles = await program.account.profile.all();
  return profiles;
}

async function getAllPostsByUser(program: Program, userWallet: PublicKey) {
  const posts = await program.account.post.all([
    {
      memcmp: {
        offset: 8, // After discriminator
        bytes: userWallet.toBase58(),
      },
    },
  ]);
  return posts;
}
```

## Best Practices

1. **Always Store Bump Seeds**: Include bump in account data to avoid recomputation
2. **Use Consistent Seed Ordering**: Keep seed order consistent across instructions
3. **Validate PDAs**: Always verify PDA derivation in instruction constraints
4. **Index Carefully**: Use counters (post_count, comment_count) for sequential indexing
5. **Handle Errors**: Account may not exist, always handle fetch errors
6. **Cache PDAs**: Derive once and reuse in frontend
7. **Document Seeds**: Clearly document seed structure for each PDA type

## Debugging Tips

### Verify PDA Derivation

```typescript
// Check if derived PDA matches expected
const [derivedPDA, bump] = PublicKey.findProgramAddressSync(seeds, programId);
console.log("Derived PDA:", derivedPDA.toBase58());
console.log("Bump:", bump);
```

### Check Account Data

```bash
# View account data
solana account <PDA_ADDRESS> --url devnet

# View account in JSON
solana account <PDA_ADDRESS> --output json --url devnet
```

### Common Errors

**Error**: `Account does not exist`

- PDA hasn't been created yet
- Wrong seeds used for derivation
- Wrong program ID

**Error**: `Seeds constraint violation`

- PDA seeds don't match expected seeds
- Index mismatch (wrong post_count or comment_count)

**Error**: `Account already in use`

- Trying to init a PDA that already exists
- Check if account exists before init

## Resources

- [Solana PDA Documentation](https://docs.solana.com/developing/programming-model/calling-between-programs#program-derived-addresses)
- [Anchor PDA Guide](https://www.anchor-lang.com/docs/pdas)
- [Solana Cookbook - PDAs](https://solanacookbook.com/core-concepts/pdas.html)

---

Understanding PDAs is crucial for Solana development. This architecture provides a scalable, deterministic way to manage user data on-chain.
