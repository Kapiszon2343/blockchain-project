import { Link } from 'react-router-dom';

export function Home() {
  return (
    <div>
      <h2>What do you want to do today?</h2>
        <div className="link-buttons">
          <Link to="/Publish" className="link-btn">Publish new story</Link>
          <Link to="/Update" className="link-btn">Expand your story with new chapters</Link>
          <Link to="/Check" className="link-btn">Check existing text</Link>
        </div>
    </div>
  )
}