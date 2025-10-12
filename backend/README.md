# Backend (Node/Express + MySQL)

Simple API that serves data for the grid.

## Setup
1) Copy `.env.example` to `.env` and fill MySQL details
2) Install deps
   - `npm install`
3) Create tables
   - Run the SQL in `../sql/sqlsetup.sql`
4) Import CSV (optional)
   - `node src/lib/csvImport.js ../data.csv`

## Run
- `npm start` (default port 4000)

## API
- GET `/api/data` — list (supports q, filters, sort, page, pageSize)
- GET `/api/data/distinct?field=Brand` — distinct values
- GET `/api/data/:id` — one record
- DELETE `/api/data/:id` — delete

Notes:
- Filters support: contains, equals, startsWith, endsWith, isEmpty, gt, lt, notEquals, in
- Data is stored in table `records` with a JSON `payload` column
