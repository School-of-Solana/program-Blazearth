# Social App Program

Solana program for a decentralized social media application.

## Program ID

```
6t5PjEe4SW7JbtHxbttwZ9gyGGmLhahA9r2v2E3iPTsZ
```

## Features

- Profile creation with username
- Post creation with IPFS metadata
- Like functionality
- Comment system
- Delete operations with authorization

## Structure

```
src/
├── lib.rs              # Program entry point
├── error.rs            # Custom errors
├── state.rs            # Account structures
└── instructions/       # Instruction handlers
    ├── initialize.rs
    ├── profile.rs
    ├── post.rs
    ├── comment.rs
    └── delete.rs
```

## Account Types

- **Profile**: User profile with username and post count
- **Post**: Post with metadata URI, likes, and comment count
- **Comment**: Comment with text linked to a post

## PDAs

- Profile: `["profile", user_pubkey]`
- Post: `["post", user_pubkey, post_index]`
- Comment: `["comment", post_pubkey, comment_index]`
