use anchor_lang::prelude::*;
use crate::state::{Post, Comment};
use crate::error::SocialAppError;

#[derive(Accounts)]
#[instruction(comment_text: String)]
pub struct CreateComment<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 32 + 4 + 280 + 8 + 8 + 1, // discriminator + post + commenter + comment_text + index + timestamp + bump
        seeds = [b"comment", post.key().as_ref(), post.comment_count.to_le_bytes().as_ref()],
        bump
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

    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn create_comment(ctx: Context<CreateComment>, comment_text: String) -> Result<()> {
    require!(!comment_text.trim().is_empty(), SocialAppError::EmptyCommentText);

    let post = &mut ctx.accounts.post;
    let comment = &mut ctx.accounts.comment;
    let clock = &ctx.accounts.clock;
    
    let post_key = post.key();
    let post_index = post.index;
    let comment_index = post.comment_count;
    
    post.comment_count = post.comment_count.checked_add(1).unwrap();
    
    comment.post = post_key;
    comment.commenter = ctx.accounts.user.key();
    comment.comment_text = comment_text;
    comment.index = comment_index;
    comment.timestamp = clock.unix_timestamp;
    comment.bump = ctx.bumps.comment;

    msg!("Comment created with index: {} on post index: {}", comment.index, post_index);
    Ok(())
}
