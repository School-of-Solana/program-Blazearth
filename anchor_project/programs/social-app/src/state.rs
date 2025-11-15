use anchor_lang::prelude::*;

#[account]
pub struct Profile {
    pub owner: Pubkey,        // 32 bytes
    pub username: String,     // 4 + 32 bytes (max 32 chars)
    pub post_count: u64,      // 8 bytes
    pub bump: u8,             // 1 byte
}

#[account]
pub struct Post {
    pub owner: Pubkey,        // 32 bytes
    pub index: u64,           // 8 bytes
    pub metadata_uri: String, // 4 + 200 bytes (max 200 chars for IPFS URLs)
    pub likes: u64,           // 8 bytes
    pub comment_count: u64,   // 8 bytes
    pub timestamp: i64,       // 8 bytes
    pub bump: u8,             // 1 byte
}

#[account]
pub struct Comment {
    pub post: Pubkey,         // 32 bytes
    pub commenter: Pubkey,    // 32 bytes
    pub comment_text: String, // 4 + 280 bytes (max 280 chars)
    pub index: u64,           // 8 bytes
    pub timestamp: i64,       // 8 bytes
    pub bump: u8,             // 1 byte
}
