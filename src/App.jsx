import { useEffect, useState } from 'react';
import Spotlight from '@enact/spotlight';
import './styles.css';

Spotlight.setPointerMode(false);

export default function App() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // Initialize Spotlight
    Spotlight.resume();
    setReady(true);
  }, []);

  return (
    <div className="app" data-spotlight-container data-spotlight-id="app-root">
      <h1 tabIndex={0} data-spotlight-container-disabled={!ready}>webOS Player</h1>
      <p>Scaffold ready. Next tasks will add UI.</p>
    </div>
  );
}
