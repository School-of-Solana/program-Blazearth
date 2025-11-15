use anchor_lang::prelude::*;

#[error_code]
pub enum SocialAppError {
    #[msg("Username cannot be empty")]
    EmptyUsername,

    #[msg("Metadata URI cannot be empty")]
    EmptyMetadataUri,

    #[msg("Comment text cannot be empty")]
    EmptyCommentText,

    #[msg("Profile already exists")]
    ProfileAlreadyExists,

    #[msg("Profile does not exist")]
    ProfileNotFound,

    #[msg("Post does not exist")]
    PostNotFound,

    #[msg("Unauthorized access")]
    Unauthorized,
}
