import { useEffect, useState } from 'react';

type BuildInfo = {
  version: string;
  environment: string;
  builtBy: string;
  builtAt: string;
  dirty: boolean;
};

// Every page shows exactly which build is running, where, and who built it.
export function VersionFooter() {
  const [info, setInfo] = useState<BuildInfo>();

  useEffect(() => {
    fetch('/version')
      .then((res) => res.json())
      .then(setInfo)
      .catch(() => undefined);
  }, []);

  if (!info) return <footer>&nbsp;</footer>;

  return (
    <footer>
      <span className={`env env-${info.environment}`}>{info.environment}</span>
      <code>{info.version}</code>
      {info.dirty && <span className="dirty">dirty</span>}
      <span>
        built by {info.builtBy} · {new Date(info.builtAt).toLocaleString()}
      </span>
    </footer>
  );
}
