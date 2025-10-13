# Generic DataGrid (React + Node)

It has a React front-end with AG Grid and a Node/Express back-end with MySQL.

## What it does
- Shows any tabular data in a grid (columns are detected from data)
- Has an Actions column (View, Delete)
- Search bar (goes to backend)
- Distinct Column filters for both text and number types (contains, equals, starts with, ends with, empty, >, <)
- Detail page for a record, with a back button
- Light/Dark mode

## How I run it locally
1) MySQL
- Create a database (for example: `bmw_db`)
- Set a `.env` in `backend/` (see `.env.example`)
- Import data from `data.csv` using the import script (already in backend)

2) Backend
- `cd backend`
- `npm install`
- `npm start`
- Server runs on http://localhost:4000

3) Frontend
- `cd frontend`
- `npm install`
- `npm start`
- App runs on http://localhost:3000

If API URL is different, set `REACT_APP_API_URL` in `frontend/.env`.

## Endpoints (short)
- GET `/api/data` — list with search, filters, sort, paging
- GET `/api/data/distinct?field=Brand` — distinct values for filters
- GET `/api/data/:id` — single record
- DELETE `/api/data/:id` — delete record

## Notes
- Grid uses server-side filtering and pagination
- Brand and BodyStyle filters have value lists (eg. Brand shows options such as [BMW, Audi....] and Body Style shows [SUV, Hatchback....] )
- You can copy text from grid cells
- instead of regular pagination implemented Infinite scroll to the Grid.
- used Zustand for state management (for centralising search queries, filters and case senitivity and eliminating prop drilling)

