# Testing & Quality Assurance Guide

## Overview
This document provides comprehensive instructions for testing the BM DataGrid application, including unit tests, integration tests, API smoke tests, linting, and code formatting.

---

## 📋 Table of Contents
1. [Backend Testing](#backend-testing)
2. [Frontend Testing](#frontend-testing)
3. [API Smoke Tests (Postman)](#api-smoke-tests)
4. [Linting & Formatting](#linting--formatting)
5. [Running All Tests](#running-all-tests)

---

## 🔧 Backend Testing

### Setup
First, install the testing dependencies:
```powershell
cd backend
npm install --save-dev jest @types/jest
```

### Running Backend Tests
```powershell
cd backend
npm test
```

### Test Coverage
The backend includes comprehensive unit tests for:
- **queryBuilder.js**: Filter operations, sorting, pagination, SQL injection protection
- **Security**: Input validation, parameterized queries
- **Edge cases**: Invalid inputs, malformed data

### Test Files
- `src/lib/queryBuilder.test.js` - Query builder unit tests

### What's Tested
✅ Text filters (contains, equals, startsWith, endsWith, isEmpty)  
✅ Numeric filters (greaterThan, lessThan, equals)  
✅ IN filters (multiple values)  
✅ Sorting (ascending, descending, numeric, date fields)  
✅ Pagination  
✅ Search functionality  
✅ SQL injection protection  
✅ Multiple filters with AND logic  

---

## ⚛️ Frontend Testing

### Setup
Testing libraries are already included in the frontend:
- `@testing-library/react`
- `@testing-library/jest-dom`
- `@testing-library/user-event`

### Running Frontend Tests
```powershell
cd frontend
npm test
```

### Interactive Test Mode
```powershell
npm test -- --watch
```

### Test Coverage Report
```powershell
npm test -- --coverage
```

### Test Files
- `src/components/filterParameter.test.js` - Filter chip component tests
- `src/components/SearchBar.test.js` - Search bar component tests

### What's Tested
✅ Filter chip rendering and deletion  
✅ IN filter value management  
✅ Search chip functionality  
✅ Clear all filters  
✅ Filter label formatting  
✅ User interactions  
✅ Edge cases and error handling  

---

## 🚀 API Smoke Tests (Postman)

### Import Collection
1. Open Postman
2. Click "Import"
3. Select `backend/BM-DataGrid-API.postman_collection.json`
4. The collection will be imported with all test requests

### Configure Environment
1. In Postman, click the environment dropdown
2. Create a new environment or edit variables:
   - `baseUrl`: `http://localhost:3001`
   - `testRecordId`: Set to a valid record ID from your database

### Running Tests

#### Run Entire Collection
1. Click on the collection name
2. Click "Run" button
3. Select all requests
4. Click "Run BM DataGrid API - Smoke Tests"

#### Run Individual Folders
- **Health Check** - Verify server is running
- **GET /api/data** - Test data retrieval, filtering, sorting
- **GET /api/data/:id** - Test single record retrieval
- **GET /api/data/distinct/:field** - Test distinct values
- **DELETE /api/data/:id** - Test record deletion (⚠️ destructive)
- **Security Tests** - Test SQL injection protection

### Test Categories

#### 1. Data Retrieval Tests
- ✅ Get first page (default)
- ✅ Pagination (page 2, size 10)
- ✅ Search by query
- ✅ Filter by Brand (equals)
- ✅ Filter by multiple brands (IN)
- ✅ Filter numeric (price > 50000)
- ✅ Sort by Brand (ascending)
- ✅ Sort by Price (descending)
- ✅ Combined: filter + search + sort

#### 2. Single Record Tests
- ✅ Get record by ID
- ✅ Get non-existent record (404)

#### 3. Distinct Values Tests
- ✅ Get distinct Brands
- ✅ Get distinct BodyStyle
- ✅ Invalid field handling

#### 4. Delete Tests
- ⚠️ Delete record (destructive)
- ✅ Delete non-existent record

#### 5. Security Tests
- ✅ SQL injection in filter value
- ✅ SQL injection in sort field
- ✅ No database errors exposed

### Automated Test Assertions
Each request includes automated tests that verify:
- Status codes (200, 404, 500)
- Response structure
- Data integrity
- Sorting correctness
- Filter accuracy
- Security protections

---

## 🔍 Linting & Formatting

### Backend Linting

#### Install ESLint
```powershell
cd backend
npm install --save-dev eslint
```

#### Run Linter
```powershell
npm run lint
```

#### Auto-fix Issues
```powershell
npm run lint:fix
```

#### Configuration
- `.eslintrc.json` - ESLint rules
- Rules: ES2022, single quotes, semicolons, no-console warnings

### Frontend Linting

#### Install ESLint & Plugins
```powershell
cd frontend
npm install --save-dev eslint eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-jsx-a11y
```

#### Run Linter
```powershell
npm run lint
```

#### Configuration
- `.eslintrc.json` - ESLint rules
- Rules: React, hooks, accessibility, double quotes, semicolons

### Code Formatting with Prettier

#### Install Prettier
```powershell
# Backend
cd backend
npm install --save-dev prettier

# Frontend
cd frontend
npm install --save-dev prettier
```

#### Format Code
```powershell
# Backend
npm run format

# Frontend
npm run format
```

#### Check Formatting
```powershell
npm run format:check
```

#### Configuration
- `.prettierrc.json` - Prettier rules
- Backend: single quotes, 100 char width
- Frontend: double quotes, 100 char width

### Add NPM Scripts

#### Backend package.json
```json
{
  "scripts": {
    "test": "jest",
    "lint": "eslint src/**/*.js",
    "lint:fix": "eslint src/**/*.js --fix",
    "format": "prettier --write \"src/**/*.js\"",
    "format:check": "prettier --check \"src/**/*.js\""
  }
}
```

#### Frontend package.json
```json
{
  "scripts": {
    "test": "react-scripts test",
    "lint": "eslint src/**/*.{js,jsx}",
    "lint:fix": "eslint src/**/*.{js,jsx} --fix",
    "format": "prettier --write \"src/**/*.{js,jsx,json,css}\"",
    "format:check": "prettier --check \"src/**/*.{js,jsx,json,css}\""
  }
}
```

---

## 🏃 Running All Tests

### Complete Test Suite

#### 1. Backend Tests
```powershell
cd backend
npm test
npm run lint
```

#### 2. Frontend Tests
```powershell
cd frontend
npm test -- --coverage
npm run lint
```

#### 3. API Smoke Tests
1. Start backend server: `cd backend && npm start`
2. Open Postman
3. Run collection: "BM DataGrid API - Smoke Tests"

### Continuous Integration Script
Create a `test-all.ps1` script:
```powershell
# Test everything
Write-Host "Running Backend Tests..." -ForegroundColor Green
cd backend
npm test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Running Backend Linter..." -ForegroundColor Green
npm run lint
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Running Frontend Tests..." -ForegroundColor Green
cd ../frontend
npm test -- --watchAll=false --coverage
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Running Frontend Linter..." -ForegroundColor Green
npm run lint
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "All tests passed!" -ForegroundColor Green
```

Run with:
```powershell
.\test-all.ps1
```

---

## 🛡️ Error Handling

### Frontend Error System
The frontend now includes comprehensive error handling:

#### Error Boundary
- Catches React component errors
- Displays user-friendly error screen
- Shows stack trace in development mode
- Component: `src/components/ErrorBoundary.js`

#### Error Snackbar
- Displays API errors as toast notifications
- Auto-dismisses after 6 seconds
- Shows error details in development
- Component: `src/components/ErrorSnackbar.js`

#### Error Store
- Global error state management with Zustand
- Accessible from any component
- Usage:
```javascript
import useErrorStore from '../store/errorStore';

const showError = useErrorStore((state) => state.showError);
showError('Error message', 'Optional details');
```

#### API Error Interceptor
- Automatically catches all API errors
- Displays appropriate error messages
- Handles network errors, 404s, 500s
- Location: `src/lib/api.js`

---

## 📊 Test Coverage Goals

### Backend
- ✅ Query builder: 100% coverage
- ✅ Security validation: 100% coverage
- ⏳ Route handlers: Add integration tests
- ⏳ Database operations: Add integration tests

### Frontend
- ✅ Filter components: 90%+ coverage
- ✅ Search components: 90%+ coverage
- ⏳ Grid component: Add integration tests
- ⏳ Detail page: Add tests

---

## 🐛 Debugging Failed Tests

### Backend Tests
```powershell
# Run with verbose output
npm test -- --verbose

# Run specific test file
npm test -- queryBuilder.test.js

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Frontend Tests
```powershell
# Run with verbose output
npm test -- --verbose

# Run specific test file
npm test -- filterParameter.test.js

# Debug in browser
npm test -- --debug
```

---

## 📝 Writing New Tests

### Backend Test Template
```javascript
import { strict as assert } from 'assert';
import { functionToTest } from './yourModule.js';

describe('Module Name', () => {
  describe('Function Name', () => {
    it('should do something specific', async () => {
      const result = await functionToTest(params);
      assert.strictEqual(result.property, expectedValue);
    });
  });
});
```

### Frontend Test Template
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import YourComponent from './YourComponent';

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', () => {
    render(<YourComponent />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(mockFunction).toHaveBeenCalled();
  });
});
```

---

## 🎯 Best Practices

1. **Write tests first** - TDD approach when adding new features
2. **Test edge cases** - Empty values, null, undefined, large datasets
3. **Mock external dependencies** - Database, API calls, third-party services
4. **Keep tests isolated** - Each test should be independent
5. **Use descriptive names** - Test names should explain what they test
6. **Run tests before commit** - Ensure all tests pass before pushing
7. **Maintain test coverage** - Aim for 80%+ coverage
8. **Update tests with code** - Keep tests in sync with implementation

---

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Postman Testing Guide](https://learning.postman.com/docs/writing-scripts/test-scripts/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Options](https://prettier.io/docs/en/options.html)

---

## ✅ Checklist

Before deploying to production:

- [ ] All backend unit tests pass
- [ ] All frontend component tests pass
- [ ] Postman smoke tests complete successfully
- [ ] No ESLint errors in backend
- [ ] No ESLint errors in frontend
- [ ] Code is formatted with Prettier
- [ ] Error boundaries catch all errors
- [ ] API error handling displays user-friendly messages
- [ ] Security tests pass (SQL injection prevention)
- [ ] Performance is acceptable under load
- [ ] Accessibility tests pass (frontend)

---

## 🆘 Support

If you encounter issues with testing:
1. Check the console for detailed error messages
2. Verify all dependencies are installed
3. Ensure the backend server is running for API tests
4. Clear node_modules and reinstall if needed
5. Check that database is properly set up and seeded

For questions or issues, refer to the main README.md or project documentation.
