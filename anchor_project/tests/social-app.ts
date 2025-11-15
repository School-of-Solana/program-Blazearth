import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SocialApp } from "../target/types/social_app";
import { expect } from "chai";

describe("social-app", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.socialApp as Program<SocialApp>;
  const provider = anchor.getProvider();

  // Test keypairs
  let userKeypair: anchor.web3.Keypair;
  let profilePda: anchor.web3.PublicKey;
  let profileBump: number;

  // Helper function to derive profile PDA
  const deriveProfilePda = (userPubkey: anchor.web3.PublicKey): [anchor.web3.PublicKey, number] => {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("profile"), userPubkey.toBuffer()],
      program.programId
    );
  };

  // Helper function to derive post PDA
  const derivePostPda = (userPubkey: anchor.web3.PublicKey, postIndex: number): [anchor.web3.PublicKey, number] => {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("post"),
        userPubkey.toBuffer(),
        new anchor.BN(postIndex).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );
  };

  // Helper function to derive comment PDA
  const deriveCommentPda = (postPubkey: anchor.web3.PublicKey, commentIndex: number): [anchor.web3.PublicKey, number] => {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("comment"),
        postPubkey.toBuffer(),
        new anchor.BN(commentIndex).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );
  };

  // Helper function to fund an account
  const fundAccount = async (pubkey: anchor.web3.PublicKey, lamports: number = 2 * anchor.web3.LAMPORTS_PER_SOL) => {
    const signature = await provider.connection.requestAirdrop(pubkey, lamports);
    await provider.connection.confirmTransaction(signature, "confirmed");
  };

  beforeEach(async () => {
    // Create a new user keypair for each test
    userKeypair = anchor.web3.Keypair.generate();

    // Derive the profile PDA
    [profilePda, profileBump] = deriveProfilePda(userKeypair.publicKey);

    // Fund the user account
    await fundAccount(userKeypair.publicKey);
  });

  describe("Profile Management", () => {
    it("Should create a profile successfully", async () => {
      const username = "testuser";

      const tx = await program.methods
        .initProfile(username)
        .accounts({
          profile: profilePda,
          user: userKeypair.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([userKeypair])
        .rpc();

      console.log("Profile creation transaction signature:", tx);

      // Fetch the created profile
      const profileAccount = await program.account.profile.fetch(profilePda);

      // Verify profile data
      expect(profileAccount.owner.toString()).to.equal(userKeypair.publicKey.toString());
      expect(profileAccount.username).to.equal(username);
      expect(profileAccount.postCount.toNumber()).to.equal(0);
      expect(profileAccount.bump).to.equal(profileBump);
    });

    it("Should fail to create profile with empty username", async () => {
      const emptyUsername = "";

      try {
        await program.methods
          .initProfile(emptyUsername)
          .accounts({
            profile: profilePda,
            user: userKeypair.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([userKeypair])
          .rpc();

        // If we reach here, the test should fail
        expect.fail("Expected transaction to fail with empty username");
      } catch (error) {
        // Verify that the error is related to empty username
        expect(error.message).to.include("Username cannot be empty");
      }
    });

    it("Should fail to create profile with whitespace-only username", async () => {
      const whitespaceUsername = "   ";

      try {
        await program.methods
          .initProfile(whitespaceUsername)
          .accounts({
            profile: profilePda,
            user: userKeypair.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([userKeypair])
          .rpc();

        // If we reach here, the test should fail
        expect.fail("Expected transaction to fail with whitespace-only username");
      } catch (error) {
        // Verify that the error is related to empty username
        expect(error.message).to.include("Username cannot be empty");
      }
    });

    it("Should fail to create duplicate profile", async () => {
      const username = "testuser";

      // Create the first profile successfully
      await program.methods
        .initProfile(username)
        .accounts({
          profile: profilePda,
          user: userKeypair.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([userKeypair])
        .rpc();

      // Try to create the same profile again - should fail
      try {
        await program.methods
          .initProfile(username)
          .accounts({
            profile: profilePda,
            user: userKeypair.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([userKeypair])
          .rpc();

        // If we reach here, the test should fail
        expect.fail("Expected transaction to fail when creating duplicate profile");
      } catch (error) {
        // The error should be related to account already existing
        // Anchor will throw an error when trying to init an account that already exists
        expect(error.message).to.include("already in use");
      }
    });

    it("Should create profiles for different users", async () => {
      const username1 = "user1";
      const username2 = "user2";

      // Create second user keypair
      const user2Keypair = anchor.web3.Keypair.generate();
      const [profile2Pda] = deriveProfilePda(user2Keypair.publicKey);

      // Fund the second user account
      await fundAccount(user2Keypair.publicKey);

      // Create first profile
      await program.methods
        .initProfile(username1)
        .accounts({
          profile: profilePda,
          user: userKeypair.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([userKeypair])
        .rpc();

      // Create second profile
      await program.methods
        .initProfile(username2)
        .accounts({
          profile: profile2Pda,
          user: user2Keypair.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([user2Keypair])
        .rpc();

      // Verify both profiles exist and have correct data
      const profile1Account = await program.account.profile.fetch(profilePda);
      const profile2Account = await program.account.profile.fetch(profile2Pda);

      expect(profile1Account.username).to.equal(username1);
      expect(profile1Account.owner.toString()).to.equal(userKeypair.publicKey.toString());

      expect(profile2Account.username).to.equal(username2);
      expect(profile2Account.owner.toString()).to.equal(user2Keypair.publicKey.toString());
    });
  });

  describe("Post Creation and Management", () => {
    beforeEach(async () => {
      // Create a profile before each post test
      const username = "testuser";
      await program.methods
        .initProfile(username)
        .accounts({
          profile: profilePda,
          user: userKeypair.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([userKeypair])
        .rpc();
    });

    it("Should create a post successfully with valid metadata", async () => {
      const metadataUri = "https://ipfs.io/ipfs/QmTest123";

      // Derive the post PDA for index 0
      const [postPda] = derivePostPda(userKeypair.publicKey, 0);

      const tx = await program.methods
        .createPost(metadataUri)
        .accounts({
          post: postPda,
          profile: profilePda,
          user: userKeypair.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([userKeypair])
        .rpc();

      console.log("Post creation transaction signature:", tx);

      // Fetch the created post
      const postAccount = await program.account.post.fetch(postPda);

      // Verify post data
      expect(postAccount.owner.toString()).to.equal(userKeypair.publicKey.toString());
      expect(postAccount.index.toNumber()).to.equal(0);
      expect(postAccount.metadataUri).to.equal(metadataUri);
      expect(postAccount.likes.toNumber()).to.equal(0);
      expect(postAccount.commentCount.toNumber()).to.equal(0);
      expect(postAccount.timestamp.toNumber()).to.be.greaterThan(0);

      // Verify profile post_count was incremented
      const profileAccount = await program.account.profile.fetch(profilePda);
      expect(profileAccount.postCount.toNumber()).to.equal(1);
    });

    it("Should create multiple posts with incrementing indices", async () => {
      const metadataUri1 = "https://ipfs.io/ipfs/QmTest1";
      const metadataUri2 = "https://ipfs.io/ipfs/QmTest2";

      // Create first post
      const [post1Pda] = derivePostPda(userKeypair.publicKey, 0);

      await program.methods
        .createPost(metadataUri1)
        .accounts({
          post: post1Pda,
          profile: profilePda,
          user: userKeypair.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([userKeypair])
        .rpc();

      // Create second post
      const [post2Pda] = derivePostPda(userKeypair.publicKey, 1);

      await program.methods
        .createPost(metadataUri2)
        .accounts({
          post: post2Pda,
          profile: profilePda,
          user: userKeypair.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([userKeypair])
        .rpc();

      // Verify both posts
      const post1Account = await program.account.post.fetch(post1Pda);
      const post2Account = await program.account.post.fetch(post2Pda);

      expect(post1Account.index.toNumber()).to.equal(0);
      expect(post1Account.metadataUri).to.equal(metadataUri1);

      expect(post2Account.index.toNumber()).to.equal(1);
      expect(post2Account.metadataUri).to.equal(metadataUri2);

      // Verify profile post_count is 2
      const profileAccount = await program.account.profile.fetch(profilePda);
      expect(profileAccount.postCount.toNumber()).to.equal(2);
    });

    it("Should fail to create post with empty metadata URI", async () => {
      const emptyMetadataUri = "";

      const [postPda] = derivePostPda(userKeypair.publicKey, 0);

      try {
        await program.methods
          .createPost(emptyMetadataUri)
          .accounts({
            post: postPda,
            profile: profilePda,
            user: userKeypair.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([userKeypair])
          .rpc();

        expect.fail("Expected transaction to fail with empty metadata URI");
      } catch (error) {
        expect(error.message).to.include("Metadata URI cannot be empty");
      }
    });

    it("Should fail to create post without profile", async () => {
      // Create a new user without a profile
      const userWithoutProfile = anchor.web3.Keypair.generate();

      // Fund the user account
      await fundAccount(userWithoutProfile.publicKey);

      // Derive PDAs for the user without profile
      const [nonExistentProfilePda] = deriveProfilePda(userWithoutProfile.publicKey);

      const [postPda] = derivePostPda(userWithoutProfile.publicKey, 0);

      const metadataUri = "https://ipfs.io/ipfs/QmTest123";

      try {
        await program.methods
          .createPost(metadataUri)
          .accounts({
            post: postPda,
            profile: nonExistentProfilePda,
            user: userWithoutProfile.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([userWithoutProfile])
          .rpc();

        expect.fail("Expected transaction to fail when creating post without profile");
      } catch (error) {
        // Anchor will throw an error when trying to load an account that doesn't exist
        expect(error.message).to.include("AnchorError");
      }
    });
  });

  describe("Like Functionality", () => {
    let postPda: anchor.web3.PublicKey;
    const metadataUri = "https://ipfs.io/ipfs/QmTest123";

    beforeEach(async () => {
      // Create a profile
      const username = "testuser";
      await program.methods
        .initProfile(username)
        .accounts({
          profile: profilePda,
          user: userKeypair.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([userKeypair])
        .rpc();

      // Create a post
      [postPda] = derivePostPda(userKeypair.publicKey, 0);

      await program.methods
        .createPost(metadataUri)
        .accounts({
          post: postPda,
          profile: profilePda,
          user: userKeypair.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([userKeypair])
        .rpc();
    });

    it("Should like a post successfully", async () => {
      // Like the post
      const tx = await program.methods
        .likePost()
        .accounts({
          post: postPda,
          user: userKeypair.publicKey,
        })
        .signers([userKeypair])
        .rpc();

      console.log("Like post transaction signature:", tx);

      // Fetch the post and verify likes count
      const postAccount = await program.account.post.fetch(postPda);
      expect(postAccount.likes.toNumber()).to.equal(1);
    });

    it("Should increment likes multiple times", async () => {
      // Like the post multiple times
      await program.methods
        .likePost()
        .accounts({
          post: postPda,
          user: userKeypair.publicKey,
        })
        .signers([userKeypair])
        .rpc();

      await program.methods
        .likePost()
        .accounts({
          post: postPda,
          user: userKeypair.publicKey,
        })
        .signers([userKeypair])
        .rpc();

      await program.methods
        .likePost()
        .accounts({
          post: postPda,
          user: userKeypair.publicKey,
        })
        .signers([userKeypair])
        .rpc();

      // Fetch the post and verify likes count
      const postAccount = await program.account.post.fetch(postPda);
      expect(postAccount.likes.toNumber()).to.equal(3);
    });

    it("Should fail to like a non-existent post", async () => {
      // Create a PDA for a post that doesn't exist
      const [nonExistentPostPda] = derivePostPda(userKeypair.publicKey, 999);

      try {
        await program.methods
          .likePost()
          .accounts({
            post: nonExistentPostPda,
            user: userKeypair.publicKey,
          })
          .signers([userKeypair])
          .rpc();

        expect.fail("Expected transaction to fail when liking non-existent post");
      } catch (error) {
        // Anchor will throw an error when trying to load an account that doesn't exist
        expect(error.message).to.include("AnchorError");
      }
    });

    it("Should fail to like with wrong PDA seeds", async () => {
      // Create a PDA with wrong seeds (using wrong owner)
      const wrongUser = anchor.web3.Keypair.generate();
      const [wrongPostPda] = derivePostPda(wrongUser.publicKey, 0);

      try {
        await program.methods
          .likePost()
          .accounts({
            post: wrongPostPda,
            user: userKeypair.publicKey,
          })
          .signers([userKeypair])
          .rpc();

        expect.fail("Expected transaction to fail with wrong PDA seeds");
      } catch (error) {
        // Anchor will throw an error when PDA seeds don't match
        expect(error.message).to.include("AnchorError");
      }
    });
  });

  describe("Comment System", () => {
    let postPda: anchor.web3.PublicKey;
    const metadataUri = "https://ipfs.io/ipfs/QmTest123";

    beforeEach(async () => {
      // Create a profile
      const username = "testuser";
      await program.methods
        .initProfile(username)
        .accounts({
          profile: profilePda,
          user: userKeypair.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([userKeypair])
        .rpc();

      // Create a post
      [postPda] = derivePostPda(userKeypair.publicKey, 0);

      await program.methods
        .createPost(metadataUri)
        .accounts({
          post: postPda,
          profile: profilePda,
          user: userKeypair.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([userKeypair])
        .rpc();
    });

    it("Should create a comment successfully", async () => {
      const commentText = "This is a great post!";

      // Derive the comment PDA for index 0
      const [commentPda] = deriveCommentPda(postPda, 0);

      const tx = await program.methods
        .createComment(commentText)
        .accounts({
          comment: commentPda,
          post: postPda,
          user: userKeypair.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([userKeypair])
        .rpc();

      console.log("Comment creation transaction signature:", tx);

      // Fetch the created comment
      const commentAccount = await program.account.comment.fetch(commentPda);

      // Verify comment data
      expect(commentAccount.post.toString()).to.equal(postPda.toString());
      expect(commentAccount.commenter.toString()).to.equal(userKeypair.publicKey.toString());
      expect(commentAccount.commentText).to.equal(commentText);
      expect(commentAccount.index.toNumber()).to.equal(0);
      expect(commentAccount.timestamp.toNumber()).to.be.greaterThan(0);

      // Verify post comment_count was incremented
      const postAccount = await program.account.post.fetch(postPda);
      expect(postAccount.commentCount.toNumber()).to.equal(1);
    });

    it("Should create multiple comments with incrementing indices", async () => {
      const commentText1 = "First comment!";
      const commentText2 = "Second comment!";

      // Create first comment
      const [comment1Pda] = deriveCommentPda(postPda, 0);

      await program.methods
        .createComment(commentText1)
        .accounts({
          comment: comment1Pda,
          post: postPda,
          user: userKeypair.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([userKeypair])
        .rpc();

      // Create second comment
      const [comment2Pda] = deriveCommentPda(postPda, 1);

      await program.methods
        .createComment(commentText2)
        .accounts({
          comment: comment2Pda,
          post: postPda,
          user: userKeypair.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([userKeypair])
        .rpc();

      // Verify both comments
      const comment1Account = await program.account.comment.fetch(comment1Pda);
      const comment2Account = await program.account.comment.fetch(comment2Pda);

      expect(comment1Account.index.toNumber()).to.equal(0);
      expect(comment1Account.commentText).to.equal(commentText1);

      expect(comment2Account.index.toNumber()).to.equal(1);
      expect(comment2Account.commentText).to.equal(commentText2);

      // Verify post comment_count is 2
      const postAccount = await program.account.post.fetch(postPda);
      expect(postAccount.commentCount.toNumber()).to.equal(2);
    });

    it("Should fail to create comment with empty text", async () => {
      const emptyCommentText = "";

      const [commentPda] = deriveCommentPda(postPda, 0);

      try {
        await program.methods
          .createComment(emptyCommentText)
          .accounts({
            comment: commentPda,
            post: postPda,
            user: userKeypair.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([userKeypair])
          .rpc();

        expect.fail("Expected transaction to fail with empty comment text");
      } catch (error) {
        expect(error.message).to.include("Comment text cannot be empty");
      }
    });

    it("Should fail to create comment on non-existent post", async () => {
      // Create a PDA for a post that doesn't exist
      const [nonExistentPostPda] = derivePostPda(userKeypair.publicKey, 999);

      const [commentPda] = deriveCommentPda(nonExistentPostPda, 0);

      const commentText = "This should fail";

      try {
        await program.methods
          .createComment(commentText)
          .accounts({
            comment: commentPda,
            post: nonExistentPostPda,
            user: userKeypair.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([userKeypair])
          .rpc();

        expect.fail("Expected transaction to fail when commenting on non-existent post");
      } catch (error) {
        // Anchor will throw an error when trying to load an account that doesn't exist
        expect(error.message).to.include("AnchorError");
      }
    });
  });
});
