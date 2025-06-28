import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Publish } from './Publish';
import { Home } from './Home';
import { Update } from './Update';
import { Check } from './Check';

import './App.css'; // We'll use this for layout styles

function App() {
  const account = useAccount();
  const { connectors, connect, status, error } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <Router>
      <div className="app-wrapper">
        {/* Top Bar */}
        <header className="top-bar">
          <h1 className="logo">Blockchain Publisher</h1>
          <div className="account-controls">
            {account.status === 'connected' ? (
              <>
                <div className="account-info">
                  Connected: <span>{account.addresses?.[0]}</span>
                </div>
                <button onClick={() => disconnect()} className="btn red">
                  Disconnect
                </button>
              </>
            ) : (
              connectors.map((connector) => (
                <button
                  key={connector.uid}
                  onClick={() => connect({ connector })}
                  className="btn blue"
                >
                  Connect {connector.name}
                </button>
              ))
            )}
          </div>
        </header>

        {/* Sidebar + Main */}
        <div className="main-layout">
          <nav className="sidebar">
            <ul>
              <li><Link to="/">🏠 Home</Link></li>
              <li><Link to="/Publish">📤 Publish</Link></li>
              <li><Link to="/Update">✏️ Update</Link></li>
              <li><Link to="/Check">🔍 Check</Link></li>
            </ul>
          </nav>

          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/blockchain-project" element={<Home />} />
              <Route path="/Publish" element={<Publish />} />
              <Route path="/Update" element={<Update />} />
              <Route path="/Check" element={<Check />} />
            </Routes>

            <div className="status-info">
              Status: {status}
              {error && <div className="error">Error: {error.message}</div>}
            </div>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
