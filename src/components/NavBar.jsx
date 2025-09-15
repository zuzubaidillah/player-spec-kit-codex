import './NavBar.css';

export default function NavBar({ title, onBack, right }) {
  return (
    <header className="nav">
      <div className="left">
        {onBack && (
          <button className="back" onClick={onBack} aria-label="Back">⟵</button>
        )}
        <h2>{title}</h2>
      </div>
      <div className="right">{right}</div>
    </header>
  );
}
