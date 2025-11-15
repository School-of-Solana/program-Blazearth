import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import './WalletConnect.css';

export function WalletConnect() {
    return (
        <div className="wallet-connect">
            <WalletMultiButton />
        </div>
    );
}
