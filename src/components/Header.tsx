interface Props {
  screen: string;
  onNavigate: (screen: 'home' | 'configure' | 'history') => void;
}

export function Header({ screen, onNavigate }: Props) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <a className="brand-mark" href="https://widaddabbas.github.io/" aria-label="Widad Dabbas homepage">
          <img src={`${import.meta.env.BASE_URL}wogo.png`} alt="W" />
        </a>
        <h1 className="site-title">N–Back</h1>
        <nav className="top-nav" aria-label="N-back navigation">
          <button className={screen === 'home' ? 'active' : ''} onClick={() => onNavigate('home')}>play</button>
          <button className={screen === 'configure' ? 'active' : ''} onClick={() => onNavigate('configure')}>configure</button>
          <button className={screen === 'history' ? 'active' : ''} onClick={() => onNavigate('history')}>history</button>
          <a href="https://widaddabbas.github.io/">author ↗</a>
        </nav>
      </div>
    </header>
  );
}
