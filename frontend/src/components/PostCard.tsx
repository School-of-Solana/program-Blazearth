import { useState, useEffect } from 'react';
import { useWallet, useAnchorWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { getConnection, getProgram } from '../utils/anchor';
import { CommentSection } from './CommentSection';
import './PostCard.css';

interface PostCardProps {
    post: {
        publicKey: PublicKey;
        account: {
            owner: PublicKey;
            index: any;
            metadataUri: string;
            likes: any;
            commentCount: any;
            timestamp: any;
            bump: number;
        };
    };
    onUpdate: () => void;
}

export function PostCard({ post, onUpdate }: PostCardProps) {
    const { publicKey } = useWallet();
    const anchorWallet = useAnchorWallet();
    const [liking, setLiking] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [username, setUsername] = useState<string>('');

    useEffect(() => {
        loadUsername();
    }, [post.account.owner]);

    const loadUsername = async () => {
        if (!anchorWallet) return;

        try {
            const connection = getConnection();
            const provider = new AnchorProvider(connection, anchorWallet, {});
            const program = getProgram(provider);

            const { getProfilePDA } = await import('../utils/anchor');
            const [profilePDA] = getProfilePDA(post.account.owner);
            const profile = await program.account.profile.fetchNullable(profilePDA);

            if (profile) {
                setUsername(profile.username);
            }
        } catch (err) {
            console.error('Error loading username:', err);
        }
    };

    const handleLike = async () => {
        if (!publicKey || !anchorWallet) return;

        setLiking(true);
        try {
            const connection = getConnection();
            const provider = new AnchorProvider(connection, anchorWallet, {});
            const program = getProgram(provider);

            await program.methods
                .likePost()
                .accountsPartial({
                    post: post.publicKey,
                    user: publicKey,
                })
                .rpc();

            onUpdate();
        } catch (err) {
            console.error('Error liking post:', err);
        } finally {
            setLiking(false);
        }
    };

    const handleDelete = async () => {
        if (!publicKey || !anchorWallet) return;
        if (!confirm('Are you sure you want to delete this post? You will get your rent back.')) return;

        setLiking(true);
        try {
            const connection = getConnection();
            const provider = new AnchorProvider(connection, anchorWallet, {});
            const program = getProgram(provider);

            const { getProfilePDA } = await import('../utils/anchor');
            const [profilePDA] = getProfilePDA(publicKey);

            await program.methods
                .deletePost()
                .accountsPartial({
                    post: post.publicKey,
                    profile: profilePDA,
                    user: publicKey,
                    owner: post.account.owner,
                })
                .rpc();

            onUpdate();
        } catch (err) {
            console.error('Error deleting post:', err);
            alert('Failed to delete post');
        } finally {
            setLiking(false);
        }
    };

    const formatTimestamp = (timestamp: any) => {
        const date = new Date(timestamp.toNumber() * 1000);
        return date.toLocaleDateString();
    };

    return (
        <div className="post-card">
            <div className="post-header">
                <div className="post-owner-info">
                    <span className="post-owner-name">{username || 'Anonymous'}</span>
                    <span className="post-owner-address">{post.account.owner.toString().slice(0, 8)}...</span>
                </div>
                <span className="post-date">{formatTimestamp(post.account.timestamp)}</span>
            </div>

            <div className="post-image">
                {post.account.metadataUri && (post.account.metadataUri.startsWith('data:') || post.account.metadataUri.startsWith('http')) ? (
                    <img src={post.account.metadataUri} alt="Post" />
                ) : (
                    <div className="image-placeholder">
                        <p>📷 Image unavailable</p>
                        <small>{post.account.metadataUri?.substring(0, 50)}...</small>
                    </div>
                )}
            </div>

            <div className="post-actions">
                <button
                    className="like-button"
                    onClick={handleLike}
                    disabled={liking || !publicKey}
                >
                    ❤️ {post.account.likes.toString()}
                </button>
                <button
                    className="comment-button"
                    onClick={() => setShowComments(!showComments)}
                >
                    💬 {post.account.commentCount.toString()}
                </button>
                {publicKey && post.account.owner.equals(publicKey) && (
                    <button
                        className="delete-button"
                        onClick={handleDelete}
                        disabled={liking}
                    >
                        🗑️ Delete
                    </button>
                )}
            </div>

            {showComments && (
                <CommentSection
                    postPubkey={post.publicKey}
                    postOwner={post.account.owner}
                    postIndex={post.account.index.toNumber()}
                    onCommentAdded={onUpdate}
                />
            )}
        </div>
    );
}
