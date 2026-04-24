'use client';

import { useState } from 'react';

const PRESETS = {
  spec: `{
  "data": [
    "A->B", "A->C", "B->D", "C->E", "E->F",
    "X->Y", "Y->Z", "Z->X",
    "P->Q", "Q->R",
    "G->H", "G->H", "G->I",
    "hello", "1->2", "A->"
  ]
}`,
  simple: `{"data": ["A->B", "A->C", "B->D"]}`,
  cycle: `{"data": ["A->B", "B->C", "C->A", "D->E"]}`,
};

function buildAscii(node, children, prefix, isLast) {
  const connector = isLast ? '└── ' : '├── ';
  const keys = Object.keys(children || {}).sort();
  let out = prefix + connector + node + '\n';
  keys.forEach((child, i) => {
    const last = i === keys.length - 1;
    const newPrefix = prefix + (isLast ? '    ' : '│   ');
    out += buildAscii(child, children[child], newPrefix, last);
  });
  return out;
}

export default function Home() {
  const [input, setInput] = useState(PRESETS.spec);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [reqData, setReqData] = useState(null);
  const [activeTab, setActiveTab] = useState('visual');

  const handleSubmit = async () => {
    setError('');
    setResult(null);

    let parsed;
    try {
      parsed = JSON.parse(input);
    } catch (e) {
      setError('Invalid JSON: ' + e.message);
      return;
    }

    if (!parsed.data || !Array.isArray(parsed.data)) {
      setError('"data" key must be an array.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/bfhl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setReqData(parsed);
      setResult(json);
      setActiveTab('visual');
    } catch (e) {
      setError('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <header>
        <h1>Bajaj Finserv Internship Task (Manish)</h1>
        <p>SRM Full Stack Engineering Challenge — Round 1</p>
      </header>

      <div className="container">
        {/* Input */}
        <div className="card">
          <h2>Request Body</h2>
          <label htmlFor="input">Enter JSON (data array of node edges):</label>
          <textarea
            id="input"
            value={input}
            onChange={e => setInput(e.target.value)}
            spellCheck={false}
          />
          <div className="btn-row">
            <button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Processing...' : 'Submit POST /bfhl'}
            </button>
            <span style={{ fontSize: 13, color: '#666' }}>Presets:</span>
            {Object.keys(PRESETS).map(k => (
              <button key={k} className="preset-btn" onClick={() => setInput(PRESETS[k])}>
                {k}
              </button>
            ))}
          </div>
          {error && <div className="error">{error}</div>}
        </div>

        {/* Results */}
        {result && (
          <div className="card">
            <h2>Response</h2>

            <div className="tabs">
              {['visual', 'response json', 'request json'].map(t => (
                <div
                  key={t}
                  className={`tab ${activeTab === t ? 'active' : ''}`}
                  onClick={() => setActiveTab(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </div>
              ))}
            </div>

            {/* Visual tab */}
            <div className={`tab-content ${activeTab === 'visual' ? 'active' : ''}`}>

              {/* Identity info */}
              <div style={{ marginBottom: 16 }}>
                <div className="info-row">User ID: <span>{result.user_id}</span></div>
                <div className="info-row">Email: <span>{result.email_id}</span></div>
                <div className="info-row">Roll No: <span>{result.college_roll_number}</span></div>
              </div>

              {/* Summary table */}
              <h3 style={{ fontSize: 14, marginBottom: 8, color: '#333' }}>Summary</h3>
              <table className="summary-table" style={{ marginBottom: 18 }}>
                <thead>
                  <tr>
                    <th>Total Trees</th>
                    <th>Total Cycles</th>
                    <th>Largest Tree Root</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{result.summary.total_trees}</td>
                    <td>{result.summary.total_cycles}</td>
                    <td>{result.summary.largest_tree_root || '—'}</td>
                  </tr>
                </tbody>
              </table>

              {/* Invalid entries */}
              {result.invalid_entries.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <label>Invalid Entries:</label>
                  <div className="tag-list">
                    {result.invalid_entries.map((e, i) => (
                      <span key={i} className="tag invalid">{e || '(empty)'}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Duplicate edges */}
              {result.duplicate_edges.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <label>Duplicate Edges:</label>
                  <div className="tag-list">
                    {result.duplicate_edges.map((e, i) => (
                      <span key={i} className="tag dup">{e}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Hierarchies */}
              <label style={{ marginBottom: 10, display: 'block' }}>Hierarchies:</label>
              {result.hierarchies.map((h, i) => {
                const isCycle = h.has_cycle === true;
                const treeText = isCycle
                  ? '(cycle detected — no tree structure)'
                  : buildAscii(h.root, h.tree[h.root], '', true);
                return (
                  <div key={i} className={`hierarchy-item ${isCycle ? 'cycle-item' : 'tree-item'}`}>
                    <h3>
                      Root: <strong>{h.root}</strong>
                      {isCycle
                        ? <span style={{ color: '#e74c3c', marginLeft: 10, fontSize: 12 }}>⚠ Cyclic</span>
                        : <span style={{ color: '#27ae60', marginLeft: 10, fontSize: 12 }}>Depth: {h.depth}</span>
                      }
                    </h3>
                    <div className="tree-pre">{treeText}</div>
                  </div>
                );
              })}
            </div>

            {/* Response JSON tab */}
            <div className={`tab-content ${activeTab === 'response json' ? 'active' : ''}`}>
              <pre className="json-pre">{JSON.stringify(result, null, 2)}</pre>
            </div>

            {/* Request JSON tab */}
            <div className={`tab-content ${activeTab === 'request json' ? 'active' : ''}`}>
              <pre className="json-pre">{JSON.stringify(reqData, null, 2)}</pre>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
