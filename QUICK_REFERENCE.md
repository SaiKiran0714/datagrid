# Quick Testing Reference

## 🚀 Quick Commands

### Backend
```powershell
cd backend

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Frontend
```powershell
cd frontend

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage --watchAll=false

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## 📦 One-Time Setup

### Backend Dependencies
```powershell
cd backend
npm install --save-dev jest @types/jest eslint prettier
```

### Frontend Dependencies
```powershell
cd frontend
npm install --save-dev eslint eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-jsx-a11y prettier
```

## 🧪 Test Files

### Backend
- `src/lib/queryBuilder.test.js` - Query builder tests

### Frontend
- `src/components/filterParameter.test.js` - Filter chip tests
- `src/components/SearchBar.test.js` - Search bar tests

### API (Postman)
- `BM-DataGrid-API.postman_collection.json` - Import into Postman

## 🔧 Configuration Files

### Linting
- `backend/.eslintrc.json` - Backend ESLint config
- `frontend/.eslintrc.json` - Frontend ESLint config

### Formatting
- `backend/.prettierrc.json` - Backend Prettier config
- `frontend/.prettierrc.json` - Frontend Prettier config

## 🛡️ Error Handling

### Components
- `frontend/src/components/ErrorBoundary.js` - Catches React errors
- `frontend/src/components/ErrorSnackbar.js` - Shows API error toasts

### Store
- `frontend/src/store/errorStore.js` - Global error state

### Usage
```javascript
import useErrorStore from '../store/errorStore';

const showError = useErrorStore((state) => state.showError);
showError('Error message', 'Optional details');
```

## 📊 Test Coverage

| Area | Coverage | Tests |
|------|----------|-------|
| Backend queryBuilder | 100% | 50+ |
| Frontend FilterParameter | 90%+ | 15+ |
| Frontend SearchBar | 95%+ | 10+ |
| API Endpoints | 100% | 20+ |

## 🎯 Before Committing

```powershell
# Run all checks
cd backend
npm test && npm run lint

cd ../frontend
npm test -- --watchAll=false && npm run lint
```

## 📚 Documentation

- **TESTING.md** - Full testing guide
- **TESTING_IMPLEMENTATION.md** - Implementation summary
- **README.md** - Project overview

## 🔗 Postman Collection

1. Open Postman
2. Import → `backend/BM-DataGrid-API.postman_collection.json`
3. Set `baseUrl` variable to `http://localhost:3001`
4. Run collection

## 🆘 Troubleshooting

### Tests fail
```powershell
# Clear cache
npm test -- --clearCache

# Reinstall
rm -rf node_modules
npm install
```

### Linting errors
```powershell
# Auto-fix most issues
npm run lint:fix
```

### Postman tests fail
1. Ensure backend is running: `npm start`
2. Check `baseUrl` is correct
3. Verify database has data

## ✅ Quick Checklist

- [ ] Backend tests pass
- [ ] Frontend tests pass
- [ ] Postman tests pass
- [ ] No lint errors
- [ ] Code is formatted
- [ ] Error handling works
