use anchor_lang::prelude::*;
use crate::state::{Profile, Post};
use crate::error::SocialAppError;

#[derive(Accounts)]
#[instruction(metadata_uri: String)]
pub struct CreatePost<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 8 + 4 + 200 + 8 + 8 + 8 + 1, // discriminator + owner + index + metadata_uri (200 bytes for IPFS URLs) + likes + comment_count + timestamp + bump
        seeds = [b"post", user.key().as_ref(), profile.post_count.to_le_bytes().as_ref()],
        bump
    )]
    pub post: Account<'info, Post>,

    #[account(
        mut,
        seeds = [b"profile", user.key().as_ref()],
        bump = profile.bump
    )]
    pub profile: Account<'info, Profile>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct LikePost<'info> {
    #[account(
        mut,
        seeds = [b"post", post.owner.as_ref(), post.index.to_le_bytes().as_ref()],
        bump = post.bump
    )]
    pub post: Account<'info, Post>,

    pub user: Signer<'info>,
}

pub fn create_post(ctx: Context<CreatePost>, metadata_uri: String) -> Result<()> {
    require!(!metadata_uri.trim().is_empty(), SocialAppError::EmptyMetadataUri);

    let post = &mut ctx.accounts.post;
    let profile = &mut ctx.accounts.profile;
    let clock = &ctx.accounts.clock;
    
    post.owner = ctx.accounts.user.key();
    post.index = profile.post_count;
    post.metadata_uri = metadata_uri;
    post.likes = 0;
    post.comment_count = 0;
    post.timestamp = clock.unix_timestamp;
    post.bump = ctx.bumps.post;

    profile.post_count = profile.post_count.checked_add(1).unwrap();

    msg!("Post created with index: {} for user: {}", post.index, post.owner);
    Ok(())
}

pub fn like_post(ctx: Context<LikePost>) -> Result<()> {
    let post = &mut ctx.accounts.post;
    post.likes = post.likes.checked_add(1).unwrap();
    msg!("Post liked! Total likes: {} for post index: {}", post.likes, post.index);
    Ok(())
}
