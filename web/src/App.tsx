import { OrgUnits } from './OrgUnits';
import { VersionFooter } from './VersionFooter';

export function App() {
  return (
    <div className="page">
      <header>
        <h1>fast-grc</h1>
        <p className="tagline">A real GRC app, shipped fast and safely with AI.</p>
      </header>
      <main>
        <OrgUnits />
      </main>
      <VersionFooter />
    </div>
  );
}
