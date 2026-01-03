# MVC Architecture Documentation

## 📁 Project Structure

```
backend/
├── config/                     # Configuration files
│   ├── database.js             # MongoDB connection
│   ├── nodemailer.js           # Email configuration
│   └── razorpay.js             # Payment gateway config
├── controllers/                # Business logic
│   ├── registrationController.js
│   └── systemController.js
├── middleware/                 # Express middleware
│   ├── errorHandler.js         # Error handling
│   └── validation.js           # Input validation
├── models/                     # Database models
│   └── Registration.js         # User registration model
├── routes/                     # API routes
│   ├── index.js               # Main route aggregator
│   ├── registrationRoutes.js  # Registration endpoints
│   └── systemRoutes.js        # System endpoints
├── services/                   # Business services
│   └── emailService.js        # Email sending service
├── server.js                  # Express app entry point
├── package.json               # Dependencies
└── .env                      # Environment variables
```

## 🏗️ MVC Components

### **Models** (`/models`)
- **Registration.js**: Mongoose schema for event registrations
- Handles data validation and database operations
- Defines relationships and constraints

### **Views** (API Responses)
- JSON responses returned by controllers
- Consistent success/error response format
- No traditional views as this is an API-only backend

### **Controllers** (`/controllers`)
- **registrationController.js**: Handles registration business logic
- **systemController.js**: Handles system operations (health, test email)
- Process requests, interact with models/services, return responses

## 🔧 Additional Components

### **Config** (`/config`)
- **database.js**: MongoDB connection setup
- **nodemailer.js**: Email service configuration
- **razorpay.js**: Payment gateway setup
- Centralizes configuration and external service connections

### **Middleware** (`/middleware`)
- **validation.js**: Input validation rules using express-validator
- **errorHandler.js**: Global error handling and 404 responses
- Reusable middleware functions for request processing

### **Routes** (`/routes`)
- **index.js**: Main router that combines all route modules
- **registrationRoutes.js**: Registration-related endpoints
- **systemRoutes.js**: System utilities (health, test email)
- Clean separation of endpoint definitions

### **Services** (`/services`)
- **emailService.js**: Email sending logic and templates
- Business logic that can be reused across controllers
- External service integrations

## 📋 API Endpoints

### System Routes
- `GET /api/health` - Health check
- `POST /api/test-email` - Test email configuration

### Registration Routes
- `GET /api/registrations` - Get all registrations
- `GET /api/registrations/:id` - Get specific registration
- `POST /api/create-order` - Create payment order
- `POST /api/verify-payment` - Verify payment
- `PATCH /api/registrations/:id/payment` - Update payment status
- `POST /api/register` - Legacy endpoint (redirects to payment flow)

## 🔄 Request Flow

1. **Client Request** → Express App
2. **Middleware** → Validation, CORS, JSON parsing
3. **Routes** → Route matching and controller dispatch
4. **Controller** → Business logic processing
5. **Model/Service** → Database operations or external services
6. **Response** → JSON formatted response

## 🎯 Benefits of MVC Structure

### **Separation of Concerns**
- Models handle data logic
- Controllers handle request/response logic
- Routes handle endpoint definitions
- Services handle business operations

### **Maintainability**
- Easy to locate and modify specific functionality
- Clear file organization
- Reusable components

### **Testability**
- Controllers can be tested independently
- Services can be mocked
- Models can be unit tested

### **Scalability**
- Easy to add new features
- Can split into microservices if needed
- Clear dependency management

## 🚀 Development Workflow

### **Adding New Features**
1. Create/update **model** if database changes needed
2. Add business logic to **controller**
3. Create/update **routes** for new endpoints
4. Add **middleware** for validation/processing
5. Create **services** for external integrations

### **Testing**
- Unit test models with mock database
- Integration test controllers with test database
- End-to-end test routes with full stack
- Test services with mock external dependencies

### **Deployment**
- Environment-specific configurations in `/config`
- All dependencies managed in `package.json`
- Environment variables in `.env` files
- Database migrations can be added to `/models`

## 🔒 Security Considerations

- Input validation in middleware
- Environment variables for sensitive data
- Error handling without exposing internals
- Authentication middleware can be added easily
- Rate limiting can be implemented as middleware

## 📈 Future Enhancements

- Add authentication middleware
- Implement logging service
- Add database migrations
- Create admin dashboard controllers
- Add file upload services
- Implement caching layer
- Add API documentation with Swagger