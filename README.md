#  Bajaj Finserv Internship Task(Manish) — SRM Full Stack Engineering Challenge

A full-stack web application that processes hierarchical node relationships and returns structured tree insights.

## Project Overview

This app exposes a `POST /api/bfhl` endpoint that accepts an array of node edge strings (e.g. `"A->B"`), builds connected trees, detects cycles, flags invalid entries and duplicate edges, and returns a structured JSON response.

## Tech Stack

- **Frontend:** Next.js (App Router), Vanilla CSS
- **Backend:** Next.js API Routes (Node.js)
- **Hosting:** Vercel


## Deployment

Deploy instantly on [Vercel](https://vercel.com). The `/api/bfhl` route is automatically handled as a serverless function.
