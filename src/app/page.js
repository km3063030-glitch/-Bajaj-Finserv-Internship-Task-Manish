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
  simple: `{
  "data": [
    "A->B",
    "A->C",
    "B->D"
  ]
}`,
  cycle: `{
  "data": [
    "A->B",
    "B->C",
    "C->A",
    "D->E"
  ]
}`,
  diamond: `{
  "data": [
    "A->B",
    "A->C",
    "B->D",
    "C->D",
    "D->E"
  ]
}`,
  invalid: `{
  "data": [
    "hello",
    "1->2",
    "AB->C",
    "A-B",
    "A->",
    "A->A",
    "",
    " A->B "
  ]
}`
};

// ASCII tree renderer
function asciiTree(node, children, prefix, isLast) {
  const conn = isLast ? '└── ' : '├── ';
  const keys = Object.keys(children || {}).sort();
  let lines = [{ prefix: prefix + conn, node }];
  keys.forEach((child, i) => {
    const lastChild = i === keys.length - 1;
    const np = prefix + (isLast ? '    ' : '│   ');
    lines = lines.concat(asciiTree(child, children[child], np, lastChild));
  });
  return lines;
}

function TreeCard({ h }) {
  const isCycle = h.has_cycle === true;
  const lines = isCycle ? [] : asciiTree(h.root, h.tree[h.root], '', true);

  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${isCycle ? 'rgba(210,153,34,0.35)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)',
      padding: '14px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: isCycle ? 'var(--warn)' : 'var(--accent2)',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '22px', fontWeight: 700 }}>{h.root}</span>
        {isCycle
          ? <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '20px', fontWeight: 600, background: 'rgba(210,153,34,0.15)', color: '#e3b341' }}>⟳ Cyclic</span>
          : <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '20px', fontWeight: 600, background: 'rgba(88,166,255,0.15)', color: '#79c0ff' }}>depth {h.depth}</span>
        }
      </div>
      {isCycle
        ? <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--warn)' }}>⚠ Cycle detected — no tree structure</div>
        : (
          <div style={{ fontFamily: 'var(--mono)', fontSize: '12.5px', lineHeight: 1.9, whiteSpace: 'pre' }}>
            {lines.map((l, i) => (
              <div key={i}>
                <span style={{ color: '#30363d' }}>{l.prefix}</span>
                <span style={{ color: 'var(--accent2)', fontWeight: 500 }}>{l.node}</span>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

function SyntaxJSON({ obj }) {
  const raw = JSON.stringify(obj, null, 2);
  // Simple token-based highlighter
  const html = raw
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/(&quot;[^&]*&quot;)\s*:/g, '<span class="jk">$1</span>:')
    .replace(/:\s*(&quot;[^&]*&quot;)/g, ': <span class="js">$1</span>')
    .replace(/:\s*(\d+\.?\d*)/g, ': <span class="jn">$1</span>')
    .replace(/:\s*(true|false)/g, ': <span class="jb">$1</span>')
    .replace(/:\s*(null)/g, ': <span class="jnu">$1</span>');
  return (
    <pre style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 18px', fontFamily: 'var(--mono)', fontSize: '12.5px', overflow: 'auto', lineHeight: 1.75, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
      dangerouslySetInnerHTML={{ __html: html }} />
  );
}

export default function Home() {
  const [input, setInput] = useState(PRESETS.spec);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [reqBody, setReqBody] = useState(null);
  const [activeTab, setActiveTab] = useState('visual');

  const handleSubmit = async () => {
    setError(null);
    let parsed;
    try {
      parsed = JSON.parse(input);
    } catch (e) {
      setError('Invalid JSON: ' + e.message);
      return;
    }
    if (!parsed.data || !Array.isArray(parsed.data)) {
      setError('JSON must have a "data" key with an array value.');
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
      setReqBody(parsed);
      setResult(json);
      setActiveTab('visual');
    } catch (e) {
      setError('API call failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        :root {
          --bg: #0d1117; --surface: #161b22; --surface2: #21262d;
          --border: #30363d; --accent: #58a6ff; --accent2: #3fb950;
          --warn: #d29922; --danger: #f85149; --text: #e6edf3;
          --muted: #8b949e; --font: 'Inter', sans-serif;
          --mono: 'JetBrains Mono', monospace; --radius: 8px;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: var(--font); background: var(--bg); color: var(--text); }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        .jk { color: #79c0ff; }
        .js { color: #a5d6ff; }
        .jn { color: #d2a8ff; }
        .jb { color: #ff7b72; }
        .jnu { color: #8b949e; }
      `}</style>

      {/* Header */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '13px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#58a6ff,#3fb950)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#fff' }}>BH</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>BFHL Tree Explorer</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>SRM Full Stack Engineering Challenge</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>
          <div style={{ width: 7, height: 7, background: 'var(--accent2)', borderRadius: '50%' }} />
          Manish_28102005 · mk2372@srmist.edu.in · RA2311003012343
        </div>
      </header>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', height: 'calc(100vh - 61px)' }}>

        {/* LEFT: Input */}
        <div style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
            Request Body
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 16, gap: 12, overflowY: 'auto' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              spellCheck={false}
              style={{ flex: 1, minHeight: 280, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 13, padding: 14, resize: 'none', outline: 'none', lineHeight: 1.65 }}
            />

            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quick Presets</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {Object.keys(PRESETS).map(k => (
                <button key={k} onClick={() => setInput(PRESETS[k])}
                  style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '5px 10px', background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}>
                  {k}
                </button>
              ))}
            </div>

            <button onClick={handleSubmit} disabled={loading}
              style={{ padding: '12px', background: 'var(--accent)', color: '#0d1117', border: 'none', borderRadius: 'var(--radius)', fontFamily: 'var(--font)', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Processing…' : '▶  Submit POST /bfhl'}
            </button>

            {error && (
              <div style={{ background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.35)', borderRadius: 'var(--radius)', padding: '12px 14px', fontSize: 13, color: '#ffa198' }}>
                {error}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Result */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
          {result ? (
            <>
              {/* Tabs */}
              <div style={{ display: 'flex', background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
                {['visual', 'response', 'request'].map(tab => (
                  <div key={tab} onClick={() => setActiveTab(tab)}
                    style={{ padding: '12px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', borderBottom: `2px solid ${activeTab === tab ? 'var(--accent)' : 'transparent'}`, color: activeTab === tab ? 'var(--accent)' : 'var(--muted)', marginBottom: '-1px', textTransform: 'capitalize' }}>
                    {tab === 'response' ? 'Response JSON' : tab === 'request' ? 'Request JSON' : 'Visual'}
                  </div>
                ))}
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                {/* Visual Tab */}
                {activeTab === 'visual' && (
                  <div>
                    {/* Summary bar */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 18 }}>
                      {[
                        { val: result.summary.total_trees, lbl: 'Valid Trees', color: 'var(--accent)' },
                        { val: result.summary.total_cycles, lbl: 'Cyclic Groups', color: 'var(--warn)' },
                        { val: result.summary.largest_tree_root || '—', lbl: 'Deepest Root', color: 'var(--accent2)' },
                      ].map((s, i) => (
                        <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
                          <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--mono)', color: s.color }}>{s.val}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{s.lbl}</div>
                        </div>
                      ))}
                    </div>

                    {result.invalid_entries.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', marginBottom: 6, fontWeight: 600 }}>Invalid Entries ({result.invalid_entries.length})</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {result.invalid_entries.map((e, i) => (
                            <span key={i} style={{ fontFamily: 'var(--mono)', fontSize: 12, padding: '4px 10px', borderRadius: 6, background: 'rgba(248,81,73,0.1)', color: '#ffa198', border: '1px solid rgba(248,81,73,0.25)' }}>{e}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.duplicate_edges.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', marginBottom: 6, fontWeight: 600 }}>Duplicate Edges ({result.duplicate_edges.length})</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {result.duplicate_edges.map((e, i) => (
                            <span key={i} style={{ fontFamily: 'var(--mono)', fontSize: 12, padding: '4px 10px', borderRadius: 6, background: 'rgba(210,153,34,0.1)', color: '#e3b341', border: '1px solid rgba(210,153,34,0.25)' }}>{e}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', marginBottom: 10, fontWeight: 600 }}>Hierarchies</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                      {result.hierarchies.map((h, i) => <TreeCard key={i} h={h} />)}
                    </div>
                  </div>
                )}

                {/* Response JSON tab */}
                {activeTab === 'response' && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent2)', marginBottom: 8 }}>Expected Response</div>
                    <SyntaxJSON obj={result} />
                  </div>
                )}

                {/* Request JSON tab */}
                {activeTab === 'request' && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', marginBottom: 8 }}>Request</div>
                    <SyntaxJSON obj={reqBody} />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: 'var(--muted)', textAlign: 'center' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
              </svg>
              <div style={{ fontSize: 15, fontWeight: 600 }}>No results yet</div>
              <p style={{ fontSize: 13, maxWidth: 300, lineHeight: 1.7 }}>Enter a JSON request body on the left and click Submit to process the hierarchies.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
