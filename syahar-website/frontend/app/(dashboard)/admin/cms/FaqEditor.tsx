'use client';

import { useState } from 'react';

type Faq = { q: string; a: string };

// Repeatable FAQ rows. Serializes to a hidden `faq` field as JSON, so the
// existing publishContent server action (which JSON.parses it) is unchanged.
export function FaqEditor({ initial }: { initial: Faq[] }) {
  const [rows, setRows] = useState<Faq[]>(
    initial.length ? initial : [{ q: '', a: '' }],
  );

  function update(i: number, key: keyof Faq, value: string) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)));
  }
  function add() {
    setRows((r) => [...r, { q: '', a: '' }]);
  }
  function remove(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i));
  }

  return (
    <div className="stack">
      <input type="hidden" name="faq" value={JSON.stringify(rows)} />
      {rows.map((row, i) => (
        <div key={i} className="card stack">
          <label>
            Question
            <input
              value={row.q}
              onChange={(e) => update(i, 'q', e.target.value)}
            />
          </label>
          <label>
            Answer
            <textarea
              rows={2}
              value={row.a}
              onChange={(e) => update(i, 'a', e.target.value)}
            />
          </label>
          <button type="button" className="btn-ghost" onClick={() => remove(i)}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" className="btn-ghost" onClick={add}>
        Add question
      </button>
    </div>
  );
}
