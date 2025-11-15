import { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { WalletContextProvider } from './contexts/WalletContextProvider';
import { WalletConnect } from './components/WalletConnect';
import { ThemeToggle } from './components/ThemeToggle';
import { ProfileManager } from './components/ProfileManager';
import { CreatePost } from './components/CreatePost';
import { Feed } from './components/Feed';
import './App.css';

function App() {
    const [feedKey, setFeedKey] = useState(0);

    const refreshFeed = () => {
        setFeedKey(prev => prev + 1);
    };

    return (
        <ThemeProvider>
            <WalletContextProvider>
                <div className="app">
                    <header className="app-header">
                        <h1>Solana Instagram</h1>
                        <div className="header-actions">
                            <ThemeToggle />
                            <WalletConnect />
                        </div>
                    </header>
                    <main className="app-main">
                        <ProfileManager />
                        <CreatePost onPostCreated={refreshFeed} />
                        <Feed key={feedKey} />
                    </main>
                </div>
            </WalletContextProvider>
        </ThemeProvider>
    );
}

export default App;
