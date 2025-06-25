import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Publish } from './Publish'
import { Home } from './Home'
import { Update } from './Update'
import { Check } from './Check'

function App() {
  const account = useAccount()
  const { connectors, connect, status, error } = useConnect()
  const { disconnect } = useDisconnect()

  return (
    <>
      <div>
        <h2>Account</h2>

        <div>
          status: {account.status}
          <br />
          addresses: <span data-testid="account-addresses">{JSON.stringify(account.addresses)}</span>
          <br />
          chainId: {account.chainId}
        </div>

        {account.status === 'connected' && (
          <button type="button" onClick={() => disconnect()}>
            Disconnect
          </button>
        )}
      </div>

      <div>
        <h2>Connect</h2>
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
            type="button"
          >
            {connector.name}
          </button>
        ))}
        <div>{status}</div>
        <div>{error?.message}</div>
      </div>

      <div className='app-container'>
        <Router>
          <Routes>
            <Route path="/" element={<Home />}/>
            <Route path="/Publish" element={<Publish />}/>
            <Route path="/Update" element={<Update />}/>
            <Route path="/Check" element={<Check />}/>
          </Routes>
        </Router>
      </div>
    </>
  )
}

export default App
