import { useAccount } from 'wagmi'
import { Link } from 'react-router-dom'

export function Home() {
  const account = useAccount()

  const linkStyle: React.CSSProperties = {
    display: 'inline-block',
    margin: '0.5rem 0',
    padding: '0.75rem 1rem',
    textDecoration: 'none',
    backgroundColor: '#4CAF50',
    color: 'white',
    borderRadius: '5px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s',
  }

  const linkHoverStyle: React.CSSProperties = {
    backgroundColor: '#45a049',
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Welcome to the Decentralized Publishing Platform</h2>
      <p>
        This application allows you to manage your written work on the blockchain.
        Whether you’re an author or a reviewer, you can take advantage of these features:
      </p>

      <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2' }}>
        <li>
          <Link to="/Publish" style={linkStyle} onMouseOver={(e) => e.currentTarget.style.backgroundColor = linkHoverStyle.backgroundColor!} onMouseOut={(e) => e.currentTarget.style.backgroundColor = linkStyle.backgroundColor!}>
            📤 Publish new works
          </Link>
        </li>
        <li>
          <Link to="/Update" style={linkStyle} onMouseOver={(e) => e.currentTarget.style.backgroundColor = linkHoverStyle.backgroundColor!} onMouseOut={(e) => e.currentTarget.style.backgroundColor = linkStyle.backgroundColor!}>
            ✏️ Add new chapters
          </Link>
        </li>
        <li>
          <Link to="/Check" style={linkStyle} onMouseOver={(e) => e.currentTarget.style.backgroundColor = linkHoverStyle.backgroundColor!} onMouseOut={(e) => e.currentTarget.style.backgroundColor = linkStyle.backgroundColor!}>
            🔍 Check for duplicates
          </Link>
        </li>
      </ul>

      <hr style={{ margin: '2rem 0' }} />

      <h3>Connection Status</h3>
      <p><strong>Status:</strong> {account.status}</p>

      {account.status === 'connected' ? (
        <div>
          <p><strong>Connected Address:</strong> {account.addresses?.[0]}</p>
          <p><strong>Chain ID:</strong> {account.chainId}</p>
        </div>
      ) : (
        <p>Please connect your MetaMask wallet (on Sepolia) using the top bar to get started.</p>
      )}
    </div>
  )
}
