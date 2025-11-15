# Project Description

**Deployed Frontend URL:** [TODO: Add your Vercel deployment URL]

**Solana Program ID:** 6t5PjEe4SW7JbtHxbttwZ9gyGGmLhahA9r2v2E3iPTsZ

## Project Overview

### Description

A decentralized social media application built on Solana. Users can create profiles, publish posts with IPFS-stored metadata, like posts, and comment on content. Each user has their own profile account derived from their wallet address, ensuring data ownership and isolation. Posts and comments are stored as separate accounts using PDAs, creating a scalable and efficient social graph on-chain.

### Key Features

- **Create Profile**: Initialize a user profile with a unique username
- **Create Posts**: Publish posts with metadata stored on IPFS (images, text content)
- **Like Posts**: Interact with posts by liking them
- **Comment System**: Add comments to posts with nested account structure
- **Delete Functionality**: Remove profiles, posts, and comments with proper authorization
- **View Feed**: Browse all posts from different users
- **Profile Management**: View and manage your profile and post count

### How to Use the dApp

1. **Connect Wallet** - Connect your Solana wallet (Phantom, Solflare, etc.)
2. **Create Profile** - Initialize your profile with a username
3. **Create Post** - Upload an image and text to IPFS, then create a post with the metadata URI
4. **Interact** - Like posts and add comments to engage with content
5. **Manage Content** - Delete your own posts, comments, or profile when needed
6. **Browse Feed** - View posts from all users in the social network

## Program Architecture

The Social App uses a modular architecture with separate account types for profiles, posts, and comments. The program leverages PDAs to create unique accounts for each entity, ensuring proper data isolation and ownership validation.

### PDA Usage

The program uses Program Derived Addresses to create deterministic accounts for profiles, posts, and comments.

**PDAs Used:**

- **Profile PDA**: Derived from seeds `["profile", user_wallet_pubkey]` - ensures each user has a unique profile
- **Post PDA**: Derived from seeds `["post", user_wallet_pubkey, post_index]` - creates unique posts for each user with sequential indexing
- **Comment PDA**: Derived from seeds `["comment", post_pubkey, comment_index]` - creates unique comments for each post with sequential indexing

### Program Instructions

**Instructions Implemented:**

- **Initialize**: Program initialization instruction for testing
- **Init Profile**: Creates a new profile account for the user with username and post counter
- **Create Post**: Creates a new post with IPFS metadata URI, increments user's post count
- **Like Post**: Increments the like counter on a post
- **Create Comment**: Adds a comment to a post, increments the post's comment count
- **Delete Profile**: Removes a user's profile (only owner can delete)
- **Delete Post**: Removes a post (only owner can delete)
- **Delete Comment**: Removes a comment (only owner can delete)

### Account Structure

```rust
#[account]
pub struct Profile {
    pub owner: Pubkey,        // The wallet that owns this profile
    pub username: String,     // User's chosen username (max 32 chars)
    pub post_count: u64,      // Number of posts created by this user
    pub created_at: i64,      // Unix timestamp when profile was created
}

#[account]
pub struct Post {
    pub owner: Pubkey,        // The wallet that created this post
    pub profile: Pubkey,      // Reference to the owner's profile
    pub metadata_uri: String, // IPFS URI containing post content (max 200 chars)
    pub likes: u64,           // Number of likes on this post
    pub comment_count: u64,   // Number of comments on this post
    pub created_at: i64,      // Unix timestamp when post was created
}

#[account]
pub struct Comment {
    pub owner: Pubkey,        // The wallet that created this comment
    pub post: Pubkey,         // Reference to the post being commented on
    pub comment_text: String, // The comment content (max 280 chars)
    pub created_at: i64,      // Unix timestamp when comment was created
}
```

## Testing

### Test Coverage

Comprehensive test suite covering all instructions with both successful operations and error conditions to ensure program security and proper authorization.

**Happy Path Tests:**

- **Initialize Program**: Successfully initializes the program
- **Create Profile**: Creates a profile with valid username
- **Create Post**: Creates a post with valid metadata URI
- **Like Post**: Successfully increments like counter
- **Create Comment**: Adds a comment to an existing post
- **Delete Operations**: Successfully deletes owned profiles, posts, and comments

**Unhappy Path Tests:**

- **Empty Username**: Fails when creating profile with empty username
- **Empty Metadata URI**: Fails when creating post without metadata
- **Empty Comment**: Fails when creating comment with empty text
- **Duplicate Profile**: Fails when trying to create a profile that already exists
- **Unauthorized Delete**: Fails when non-owner tries to delete content
- **Profile Not Found**: Fails when trying to create post without profile
- **Post Not Found**: Fails when trying to comment on non-existent post

### Running Tests

```bash
cd anchor_project
yarn install
anchor test
```

### Additional Notes for Evaluators

This social app demonstrates a complete social media platform on Solana with proper account management, authorization checks, and scalable PDA architecture. The modular code structure separates concerns into different files (state, errors, instructions) for maintainability. The frontend integrates with Solana wallet adapters and IPFS for decentralized content storage, providing a full Web3 social experience.
