import { useState, useEffect } from 'react';
import { useWallet, useAnchorWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { getConnection, getProgram } from '../utils/anchor';
import { PostCard } from './PostCard';
import './Feed.css';

interface Post {
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
}

export function Feed() {
    const { publicKey } = useWallet();
    const anchorWallet = useAnchorWallet();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (publicKey && anchorWallet) {
            loadPosts();
        } else {
            setLoading(false);
        }
    }, [publicKey, anchorWallet]);

    const loadPosts = async () => {
        if (!anchorWallet) {
            setLoading(false);
            return;
        }

        try {
            const connection = getConnection();
            const provider = new AnchorProvider(connection, anchorWallet, {});
            const program = getProgram(provider);

            const allPosts = await program.account.post.all();

            // Sort by timestamp (newest first)
            const sortedPosts = allPosts.sort((a: any, b: any) => {
                return b.account.timestamp.toNumber() - a.account.timestamp.toNumber();
            });

            setPosts(sortedPosts as any);
        } catch (err) {
            console.error('Error loading posts:', err);
        } finally {
            setLoading(false);
        }
    };

    const refreshPost = async (postPubkey: PublicKey) => {
        if (!anchorWallet) return;

        try {
            const connection = getConnection();
            const provider = new AnchorProvider(connection, anchorWallet, {});
            const program = getProgram(provider);

            const updatedPost = await program.account.post.fetch(postPubkey);

            setPosts(prevPosts =>
                prevPosts.map(post =>
                    post.publicKey.equals(postPubkey)
                        ? { ...post, account: updatedPost as any }
                        : post
                )
            );
        } catch (err) {
            // If post doesn't exist (deleted), reload all posts
            console.log('Post not found, reloading feed...');
            await loadPosts();
        }
    };

    if (!publicKey) {
        return (
            <div className="feed">
                <p className="no-posts">Connect your wallet to see posts</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="feed">
                <p className="loading">Loading posts...</p>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="feed">
                <p className="no-posts">No posts yet. Create the first one!</p>
            </div>
        );
    }

    return (
        <div className="feed">
            <h2>Feed</h2>
            {posts.map((post) => (
                <PostCard
                    key={post.publicKey.toString()}
                    post={post}
                    onUpdate={() => refreshPost(post.publicKey)}
                />
            ))}
        </div>
    );
}
