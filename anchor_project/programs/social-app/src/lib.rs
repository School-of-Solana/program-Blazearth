use anchor_lang::prelude::*;

// Module declarations
pub mod error;
pub mod state;
pub mod instructions;

// Re-export for external use
pub use error::*;
pub use state::*;

// Import instructions
use instructions::*;

declare_id!("6t5PjEe4SW7JbtHxbttwZ9gyGGmLhahA9r2v2E3iPTsZ");

#[program]
pub mod social_app {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize::initialize(ctx)
    }

    pub fn init_profile(ctx: Context<InitProfile>, username: String) -> Result<()> {
        instructions::profile::init_profile(ctx, username)
    }

    pub fn create_post(ctx: Context<CreatePost>, metadata_uri: String) -> Result<()> {
        instructions::post::create_post(ctx, metadata_uri)
    }

    pub fn like_post(ctx: Context<LikePost>) -> Result<()> {
        instructions::post::like_post(ctx)
    }

    pub fn create_comment(ctx: Context<CreateComment>, comment_text: String) -> Result<()> {
        instructions::comment::create_comment(ctx, comment_text)
    }

    pub fn delete_profile(ctx: Context<DeleteProfile>) -> Result<()> {
        instructions::delete::delete_profile(ctx)
    }

    pub fn delete_post(ctx: Context<DeletePost>) -> Result<()> {
        instructions::delete::delete_post(ctx)
    }

    pub fn delete_comment(ctx: Context<DeleteComment>) -> Result<()> {
        instructions::delete::delete_comment(ctx)
    }
}
