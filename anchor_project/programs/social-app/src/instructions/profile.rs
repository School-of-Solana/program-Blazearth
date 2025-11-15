use anchor_lang::prelude::*;
use crate::state::Profile;
use crate::error::SocialAppError;

#[derive(Accounts)]
#[instruction(username: String)]
pub struct InitProfile<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 4 + 32 + 8 + 1, // discriminator + owner + username + post_count + bump
        seeds = [b"profile", user.key().as_ref()],
        bump
    )]
    pub profile: Account<'info, Profile>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn init_profile(ctx: Context<InitProfile>, username: String) -> Result<()> {
    require!(!username.trim().is_empty(), SocialAppError::EmptyUsername);

    let profile = &mut ctx.accounts.profile;
    profile.owner = ctx.accounts.user.key();
    profile.username = username;
    profile.post_count = 0;
    profile.bump = ctx.bumps.profile;

    msg!("Profile created for user: {}", profile.owner);
    Ok(())
}
