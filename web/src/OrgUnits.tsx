import { useEffect, useState, type FormEvent } from 'react';
import type { CreateOrgUnitDto, OrgUnitDto } from '../../src/org-units/org-unit.dto';

type Row = OrgUnitDto & { depth: number; parentName: string };

// Flattens the hierarchy into display order: each unit followed by its children.
function toRows(units: OrgUnitDto[]): Row[] {
  const byId = new Map(units.map((u) => [u.id, u]));
  const children = (parentId: string | null) => units.filter((u) => u.parentId === parentId);
  const rows: Row[] = [];
  const visit = (unit: OrgUnitDto, depth: number) => {
    rows.push({ ...unit, depth, parentName: byId.get(unit.parentId ?? '')?.name ?? '' });
    children(unit.id).forEach((child) => visit(child, depth + 1));
  };
  children(null).forEach((root) => visit(root, 0));
  return rows;
}

export function OrgUnits() {
  const [units, setUnits] = useState<OrgUnitDto[]>([]);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [error, setError] = useState('');

  const load = () =>
    fetch('/api/org-units')
      .then((res) => res.json())
      .then(setUnits);

  useEffect(() => {
    load().catch(() => setError('Could not load org units'));
  }, []);

  const add = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    const body: CreateOrgUnitDto = { name, parentId: parentId || null };
    const res = await fetch('/api/org-units', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      setError((await res.json()).message ?? 'Could not add org unit');
      return;
    }
    setName('');
    await load();
  };

  const rows = toRows(units);

  return (
    <section>
      <h2>Org units</h2>
      <form className="add-form" onSubmit={add}>
        <input
          placeholder="New org unit name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <select value={parentId} onChange={(e) => setParentId(e.target.value)}>
          <option value="">No parent (top level)</option>
          {rows.map((u) => (
            <option key={u.id} value={u.id}>
              {' '.repeat(u.depth * 3)}
              {u.name}
            </option>
          ))}
        </select>
        <button type="submit">Add</button>
      </form>
      {error && <p className="error">{error}</p>}
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Parent</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id}>
              <td style={{ paddingLeft: 12 + u.depth * 20 }}>{u.name}</td>
              <td className="muted">{u.parentName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
