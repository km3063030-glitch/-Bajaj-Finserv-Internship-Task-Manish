#  Bajaj Finserv Internship Task(Manish) — SRM Full Stack Engineering Challenge

A full-stack web application that processes hierarchical node relationships and returns structured tree insights.

## Project Overview

This app exposes a `POST /api/bfhl` endpoint that accepts an array of node edge strings (e.g. `"A->B"`), builds connected trees, detects cycles, flags invalid entries and duplicate edges, and returns a structured JSON response.

## Tech Stack

- **Frontend:** Next.js (App Router), Vanilla CSS
- **Backend:** Next.js API Routes (Node.js)
- **Hosting:** Render


## Deployment

Deploy on [Render](https://render.com). Create a new Web Service, connect your GitHub repo, set build command to `npm run build` and start command to `npm start`. The `/api/bfhl` route will be handled as a serverless function.
