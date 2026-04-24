# BFHL Tree Explorer — SRM Full Stack Engineering Challenge

A full-stack web application that processes hierarchical node relationships and returns structured tree insights.

## Project Overview

This app exposes a `POST /api/bfhl` endpoint that accepts an array of node edge strings (e.g. `"A->B"`), builds connected trees, detects cycles, flags invalid entries and duplicate edges, and returns a structured JSON response.

## Tech Stack

- **Frontend:** Next.js (App Router), Vanilla CSS
- **Backend:** Next.js API Routes (Node.js)
- **Hosting:** Vercel

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API

### `POST /api/bfhl`

**Request body:**
```json
{
  "data": ["A->B", "A->C", "B->D"]
}
```

**Response:**
```json
{
  "user_id": "Manish_28102005",
  "email_id": "mk2372@srmist.edu.in",
  "college_roll_number": "RA2311003012343",
  "hierarchies": [...],
  "invalid_entries": [...],
  "duplicate_edges": [...],
  "summary": {
    "total_trees": 1,
    "total_cycles": 0,
    "largest_tree_root": "A"
  }
}
```

## Processing Rules

- Valid edges follow the pattern `X->Y` where X and Y are single uppercase letters (A–Z).
- Self-loops (`A->A`), missing nodes (`A->`), multi-character nodes (`AB->C`), wrong separator (`A-B`), and non-uppercase entries are all treated as **invalid**.
- Duplicate edges are tracked — only the first occurrence is used for tree construction.
- If a node has multiple parents, the **first-encountered** parent wins (diamond / multi-parent case).
- Cycles are detected per connected component. Cyclic components return `tree: {}` and `has_cycle: true`.
- Depth = number of nodes on the longest root-to-leaf path.
- `largest_tree_root` uses depth as the primary metric; alphabetical order is the tiebreaker.

## Deployment

Deploy instantly on [Vercel](https://vercel.com). The `/api/bfhl` route is automatically handled as a serverless function.
