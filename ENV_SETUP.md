# Environment Configuration Guide

## Frontend Environment Variables

The application uses environment variables for configuration. These are loaded automatically by Vite.

### Development Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the values in `.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:5000
   VITE_RAZORPAY_KEY_ID=your_razorpay_test_key
   ```

### Production Setup

1. Create `.env.production` file:
   ```env
   VITE_API_BASE_URL=https://your-production-api.com
   VITE_RAZORPAY_KEY_ID=your_razorpay_live_key
   ```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:5000` |


### Important Notes

- All frontend environment variables must be prefixed with `VITE_`
- Environment files are excluded from git for security
- Use `.env.example` as a template for required variables
- Update backend `.env` file separately for backend configuration

### API Configuration

The application uses a centralized config file (`src/config.js`) that reads environment variables and provides:
- API endpoint definitions
- Helper functions for building URLs
- Default fallback values

### Usage in Code

```javascript
import { config, buildApiUrl, API_ENDPOINTS } from './config.js'

// Use config values
const apiUrl = config.API_URL

// Build API URLs
const createOrderUrl = buildApiUrl(API_ENDPOINTS.CREATE_ORDER)
```