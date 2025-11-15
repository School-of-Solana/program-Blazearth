import { useState, useEffect } from 'react';
import { useWallet, useAnchorWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@coral-xyz/anchor';
import { getConnection, getProgram, getProfilePDA } from '../utils/anchor';
import './ProfileManager.css';

export function ProfileManager() {
    const { publicKey } = useWallet();
    const anchorWallet = useAnchorWallet();
    const [username, setUsername] = useState('');
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (publicKey && anchorWallet) {
            loadProfile();
        } else {
            setProfile(null);
        }
    }, [publicKey, anchorWallet]);

    const loadProfile = async () => {
        if (!publicKey || !anchorWallet) return;

        try {
            const connection = getConnection();
            const provider = new AnchorProvider(connection, anchorWallet, {});
            const program = getProgram(provider);

            const [profilePDA] = getProfilePDA(publicKey);
            const profileAccount = await program.account.profile.fetchNullable(profilePDA);

            setProfile(profileAccount);
        } catch (err) {
            console.error('Error loading profile:', err);
        }
    };

    const createProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!publicKey || !anchorWallet || !username.trim()) return;

        setLoading(true);
        setError('');

        try {
            const connection = getConnection();
            const provider = new AnchorProvider(connection, anchorWallet, {});
            const program = getProgram(provider);

            await program.methods
                .initProfile(username)
                .accounts({
                    user: publicKey,
                })
                .rpc();

            setUsername('');
            await loadProfile();
        } catch (err: any) {
            console.error('Error creating profile:', err);
            setError(err.message || 'Failed to create profile');
        } finally {
            setLoading(false);
        }
    };

    if (!publicKey) {
        return (
            <div className="profile-manager">
                <p className="connect-message">Connect your wallet to get started</p>
            </div>
        );
    }

    const deleteProfile = async () => {
        if (!publicKey || !anchorWallet) return;
        if (!confirm('Are you sure you want to delete your profile? You will get your rent back.')) return;

        setLoading(true);
        try {
            const connection = getConnection();
            const provider = new AnchorProvider(connection, anchorWallet, {});
            const program = getProgram(provider);

            const [profilePDA] = getProfilePDA(publicKey);

            await program.methods
                .deleteProfile()
                .accountsPartial({
                    profile: profilePDA,
                    user: publicKey,
                    owner: publicKey,
                })
                .rpc();

            setProfile(null);
        } catch (err: any) {
            console.error('Error deleting profile:', err);
            alert('Failed to delete profile');
        } finally {
            setLoading(false);
        }
    };

    if (profile) {
        return (
            <div className="profile-manager">
                <div className="profile-info">
                    <h2>Welcome, {profile.username}!</h2>
                    <p>Posts: {profile.postCount.toString()}</p>
                    <button
                        className="delete-profile-button"
                        onClick={deleteProfile}
                        disabled={loading}
                    >
                        Delete Profile
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-manager">
            <div className="profile-form">
                <h2>Create Your Profile</h2>
                <form onSubmit={createProfile}>
                    <input
                        type="text"
                        placeholder="Enter username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={loading}
                        required
                    />
                    <button type="submit" disabled={loading || !username.trim()}>
                        {loading ? 'Creating...' : 'Create Profile'}
                    </button>
                </form>
                {error && <p className="error">{error}</p>}
            </div>
        </div>
    );
}
