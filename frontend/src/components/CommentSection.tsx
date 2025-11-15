import { useState, useEffect } from 'react';
import { useWallet, useAnchorWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, SYSVAR_CLOCK_PUBKEY } from '@solana/web3.js';
import { getConnection, getProgram } from '../utils/anchor';
import './CommentSection.css';

interface CommentSectionProps {
    postPubkey: PublicKey;
    postOwner: PublicKey;
    postIndex: number;
    onCommentAdded: () => void;
}

interface Comment {
    publicKey: PublicKey;
    account: {
        post: PublicKey;
        commenter: PublicKey;
        commentText: string;
        index: any;
        timestamp: any;
        bump: number;
    };
}

export function CommentSection({ postPubkey, onCommentAdded }: CommentSectionProps) {
    const { publicKey } = useWallet();
    const anchorWallet = useAnchorWallet();
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentText, setCommentText] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingComments, setLoadingComments] = useState(true);

    useEffect(() => {
        loadComments();
    }, [postPubkey]);

    const loadComments = async () => {
        if (!anchorWallet) {
            setLoadingComments(false);
            return;
        }

        try {
            const connection = getConnection();
            const provider = new AnchorProvider(connection, anchorWallet, {});
            const program = getProgram(provider);

            const allComments = await program.account.comment.all([
                {
                    memcmp: {
                        offset: 8,
                        bytes: postPubkey.toBase58(),
                    },
                },
            ]);

            const sortedComments = allComments.sort((a: any, b: any) => {
                return a.account.timestamp.toNumber() - b.account.timestamp.toNumber();
            });

            setComments(sortedComments as any);
        } catch (err) {
            console.error('Error loading comments:', err);
        } finally {
            setLoadingComments(false);
        }
    };

    const addComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!publicKey || !anchorWallet || !commentText.trim()) return;

        setLoading(true);
        try {
            const connection = getConnection();
            const provider = new AnchorProvider(connection, anchorWallet, {});
            const program = getProgram(provider);

            // Get post account to derive comment PDA
            const postAccount = await program.account.post.fetch(postPubkey);
            const commentIndex = postAccount.commentCount.toNumber();

            // Derive comment PDA
            const indexBuffer = Buffer.alloc(8);
            indexBuffer.writeBigUInt64LE(BigInt(commentIndex));
            const [commentPDA] = PublicKey.findProgramAddressSync(
                [Buffer.from('comment'), postPubkey.toBuffer(), indexBuffer],
                program.programId
            );

            await program.methods
                .createComment(commentText)
                .accountsPartial({
                    comment: commentPDA,
                    post: postPubkey,
                    user: publicKey,
                    systemProgram: SystemProgram.programId,
                    clock: SYSVAR_CLOCK_PUBKEY,
                })
                .rpc();

            setCommentText('');
            await loadComments();
            onCommentAdded();
        } catch (err) {
            console.error('Error adding comment:', err);
        } finally {
            setLoading(false);
        }
    };

    const deleteComment = async (commentPubkey: PublicKey, commenter: PublicKey) => {
        if (!publicKey || !anchorWallet) return;
        if (!confirm('Delete this comment? You will get your rent back.')) return;

        setLoading(true);
        try {
            const connection = getConnection();
            const provider = new AnchorProvider(connection, anchorWallet, {});
            const program = getProgram(provider);

            await program.methods
                .deleteComment()
                .accountsPartial({
                    comment: commentPubkey,
                    post: postPubkey,
                    user: publicKey,
                    commenter: commenter,
                })
                .rpc();

            await loadComments();
            onCommentAdded();
        } catch (err) {
            console.error('Error deleting comment:', err);
            alert('Failed to delete comment');
        } finally {
            setLoading(false);
        }
    };

    const formatTimestamp = (timestamp: any) => {
        const date = new Date(timestamp.toNumber() * 1000);
        return date.toLocaleString();
    };

    return (
        <div className="comment-section">
            <div className="comments-list">
                {loadingComments ? (
                    <p className="loading-comments">Loading comments...</p>
                ) : comments.length === 0 ? (
                    <p className="no-comments">No comments yet</p>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.publicKey.toString()} className="comment">
                            <div className="comment-header">
                                <span className="commenter">
                                    {comment.account.commenter.toString().slice(0, 8)}...
                                </span>
                                <span className="comment-date">
                                    {formatTimestamp(comment.account.timestamp)}
                                </span>
                                {publicKey && comment.account.commenter.equals(publicKey) && (
                                    <button
                                        className="delete-comment-button"
                                        onClick={() => deleteComment(comment.publicKey, comment.account.commenter)}
                                        disabled={loading}
                                    >
                                        🗑️
                                    </button>
                                )}
                            </div>
                            <p className="comment-text">{comment.account.commentText}</p>
                        </div>
                    ))
                )}
            </div>

            {publicKey && (
                <form onSubmit={addComment} className="comment-form">
                    <input
                        type="text"
                        placeholder="Add a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        disabled={loading}
                        maxLength={280}
                    />
                    <button type="submit" disabled={loading || !commentText.trim()}>
                        {loading ? 'Posting...' : 'Post'}
                    </button>
                </form>
            )}
        </div>
    );
}
