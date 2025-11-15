use anchor_lang::prelude::*;
use crate::state::{Profile, Post, Comment};

#[derive(Accounts)]
pub struct DeleteProfile<'info> {
    #[account(
        mut,
        close = user,
        seeds = [b"profile", user.key().as_ref()],
        bump = profile.bump,
        has_one = owner @ crate::error::SocialAppError::Unauthorized
    )]
    pub profile: Account<'info, Profile>,

    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK: This is the owner field in the profile account
    pub owner: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct DeletePost<'info> {
    #[account(
        mut,
        close = user,
        seeds = [b"post", post.owner.as_ref(), post.index.to_le_bytes().as_ref()],
        bump = post.bump,
        has_one = owner @ crate::error::SocialAppError::Unauthorized
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

    /// CHECK: This is the owner field in the post account
    pub owner: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct DeleteComment<'info> {
    #[account(
        mut,
        close = user,
        seeds = [b"comment", comment.post.as_ref(), comment.index.to_le_bytes().as_ref()],
        bump = comment.bump,
        has_one = commenter @ crate::error::SocialAppError::Unauthorized
    )]
    pub comment: Account<'info, Comment>,

    #[account(
        mut,
        seeds = [b"post", post.owner.as_ref(), post.index.to_le_bytes().as_ref()],
        bump = post.bump
    )]
    pub post: Account<'info, Post>,

    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK: This is the commenter field in the comment account
    pub commenter: AccountInfo<'info>,
}

pub fn delete_profile(ctx: Context<DeleteProfile>) -> Result<()> {
    msg!("Profile deleted for user: {}", ctx.accounts.profile.owner);
    Ok(())
}

pub fn delete_post(ctx: Context<DeletePost>) -> Result<()> {
    let profile = &mut ctx.accounts.profile;
    
    // Decrement post count
    profile.post_count = profile.post_count.saturating_sub(1);
    
    msg!("Post deleted with index: {} for user: {}", ctx.accounts.post.index, ctx.accounts.post.owner);
    Ok(())
}

pub fn delete_comment(ctx: Context<DeleteComment>) -> Result<()> {
    let post = &mut ctx.accounts.post;
    
    // Decrement comment count
    post.comment_count = post.comment_count.saturating_sub(1);
    
    msg!("Comment deleted with index: {} by user: {}", ctx.accounts.comment.index, ctx.accounts.comment.commenter);
    Ok(())
}
