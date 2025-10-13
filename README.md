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

## Tech Stack

### Frontend
- **React** 19.2.0 - UI framework
- **AG Grid Enterprise** 34.2.0 - Advanced data grid with filtering, sorting, infinite scroll
- **Material-UI (MUI)** 6.3.0 - Component library for UI elements
- **Zustand** 5.0.3 - Lightweight state management
- **TanStack Query** 5.64.2 - Server state management, caching, infinite queries
- **React Router** 7.1.1 - Client-side routing
- **Axios** 1.7.9 - HTTP client

### Backend
- **Node.js** with **Express** 4.21.2 - Web server framework
- **MySQL2** 3.11.5 - Database driver with promise support
- **dotenv** 16.4.7 - Environment variable management
- **cors** 2.8.5 - Cross-origin resource sharing

### Testing & Quality

#### Backend Testing
- **Jest** 29.7.0 - Testing framework with ES module support
- **Test Coverage**: 33 unit tests for query builder
  - Text filters (contains, equals, notContains, startsWith, endsWith)
  - Numeric filters (greater than, less than, equals)
  - IN filters (multiple values)
  - Empty/not empty filters
  - Sorting (ascending, descending, numeric, date)
  - Search functionality
  - SQL injection protection
  - Field validation
  - Edge cases

#### Frontend Testing
- **Jest** 27.5.1 - Test runner
- **@testing-library/react** 16.3.0 - Component testing utilities
- **@testing-library/jest-dom** 6.9.1 - Custom Jest matchers
- **@testing-library/user-event** 14.6.3 - User interaction simulation
- **Test Coverage**: 32 tests across 3 test suites
  - Component rendering tests
  - User interaction tests (clicks, input changes)
  - Zustand store integration tests
  - Filter chip display and deletion
  - Search bar functionality
  - Accessibility tests
  - Edge case handling

#### API Testing
- **Postman Collection** - 20+ automated API tests
  - GET /api/data with filters, sorting, pagination
  - GET /api/data/:id (single record)
  - DELETE /api/data/:id
  - GET /api/data/distinct/:field
  - Security tests (SQL injection, XSS)
  - Error handling tests

#### Code Quality
- **ESLint** 9.37.0 - JavaScript/React linting
- **Prettier** 3.4.2 - Code formatting
- **Error Handling**: Custom ErrorBoundary, ErrorSnackbar, global error store

## Testing

All tests are passing: ✅ **Backend: 33/33** | ✅ **Frontend: 32/32**

### Run Tests

**Backend Tests:**
```bash
cd backend
npm test
```

**Frontend Tests:**
```bash
cd frontend
npm test
```

**API Tests:**
- Import `backend/BM-DataGrid-API.postman_collection.json` into Postman
- Run collection with automated assertions

**Linting:**
```bash
# Backend
cd backend
npm run lint

# Frontend  
cd frontend
npm run lint
```

### Test Documentation
- 📄 **TESTING.md** - Comprehensive testing guide
- 📄 **TESTING_IMPLEMENTATION.md** - Implementation details
- 📄 **TEST_RESULTS.md** - Current test results and coverage
- 📄 **QUICK_REFERENCE.md** - Quick command reference

