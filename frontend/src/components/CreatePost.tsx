import { useState } from 'react';
import { useWallet, useAnchorWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@coral-xyz/anchor';
import { getConnection, getProgram } from '../utils/anchor';
import { uploadToIPFS } from '../utils/ipfs';
import './CreatePost.css';

interface CreatePostProps {
    onPostCreated?: () => void;
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
    const { publicKey } = useWallet();
    const anchorWallet = useAnchorWallet();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const createPost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!publicKey || !anchorWallet || !selectedFile) return;

        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            // Upload to IPFS
            const metadataUri = await uploadToIPFS(selectedFile);

            // Create post on-chain
            const connection = getConnection();
            const provider = new AnchorProvider(connection, anchorWallet, {});
            const program = getProgram(provider);

            await program.methods
                .createPost(metadataUri)
                .accounts({
                    user: publicKey,
                })
                .rpc();

            setSuccess(true);
            setSelectedFile(null);
            setPreview('');

            // Refresh feed
            if (onPostCreated) {
                onPostCreated();
            }

            // Reset form after 2 seconds
            setTimeout(() => setSuccess(false), 2000);
        } catch (err: any) {
            console.error('Error creating post:', err);
            setError(err.message || 'Failed to create post');
        } finally {
            setLoading(false);
        }
    };

    if (!publicKey) {
        return null;
    }

    return (
        <div className="create-post">
            <h2>Create Post</h2>
            <form onSubmit={createPost}>
                <div className="file-input-wrapper">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        disabled={loading}
                        id="file-input"
                    />
                    <label htmlFor="file-input" className="file-input-label">
                        {selectedFile ? selectedFile.name : 'Choose an image'}
                    </label>
                </div>

                {preview && (
                    <div className="preview">
                        <img src={preview} alt="Preview" />
                    </div>
                )}

                <button type="submit" disabled={loading || !selectedFile}>
                    {loading ? 'Posting...' : 'Create Post'}
                </button>
            </form>

            {error && <p className="error">{error}</p>}
            {success && <p className="success">Post created successfully!</p>}
        </div>
    );
}
