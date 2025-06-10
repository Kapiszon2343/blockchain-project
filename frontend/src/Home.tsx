import { Link } from 'react-router-dom';

export function Home() {
  return (
    <div>
      <h2>What do you want to do today?</h2>
        <Link to="/Publish">Publish new story</Link> <br />
        <Link to="/Update">Expand your story with new chapters</Link> <br />
        <Link to="/Check">Check existing text</Link> <br />
    </div>
  )
}