# MLM System - Multi-Level Marketing Platform

A comprehensive Multi-Level Marketing (MLM) system built with Node.js, Express, React, TypeScript, and MongoDB. This platform provides a complete solution for managing MLM businesses with user registration, genealogy trees, commission calculations, and analytics.

## Features

### Backend Features
- **User Management**: Registration, authentication, profile management
- **MLM Business Logic**: Binary tree structure, commission calculations
- **Genealogy System**: Network visualization and management
- **Commission Tracking**: Direct, binary, matching, and leadership commissions
- **Product Management**: Product catalog with commission rates
- **Order Processing**: Order management and tracking
- **Admin Dashboard**: System administration and user management

### Frontend Features
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Dashboard**: Overview of earnings, team stats, and recent activity
- **Genealogy Tree**: Interactive network visualization
- **Commission History**: Detailed earnings tracking
- **Product Catalog**: Browse and manage products
- **Analytics**: Charts and reports for business insights
- **Authentication**: Secure login and registration

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Express Validator** - Input validation
- **Helmet** - Security middleware

### Frontend
- **React** - UI library
- **TypeScript** - Type safety
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Lucide React** - Icons

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mlm-system
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Configuration**
   
   Create a `.env` file in the `server` directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/mlm_system
   JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
   NODE_ENV=development
   ```

4. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running on your system
   mongod
   ```

5. **Run the application**
   ```bash
   # Development mode (runs both frontend and backend)
   npm run dev
   
   # Or run separately:
   npm run server  # Backend only
   npm run client  # Frontend only
   ```

6. **Access the application**
   - Frontend: http://152.59.144.69:3000
   - Backend API: http://152.59.144.69:5001

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### MLM Operations
- `GET /api/mlm/genealogy/:userId` - Get genealogy tree
- `GET /api/mlm/team-stats/:userId` - Get team statistics
- `GET /api/mlm/commissions/:userId` - Get commission history
- `GET /api/mlm/downline/:userId` - Get downline members
- `GET /api/mlm/upline/:userId` - Get upline path
- `GET /api/mlm/earnings/:userId` - Get earnings summary

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

## Database Schema

### User Model
- Personal information (name, email, phone, address)
- MLM-specific fields (sponsor, position, level)
- Earnings and commission tracking
- Account status and permissions

### Commission Model
- Commission details (amount, percentage, type)
- Source and recipient tracking
- Status and payment information
- Transaction history

### Product Model
- Product information (name, description, price)
- Point values for commission calculation
- Commission rates for different types
- Inventory and status tracking

### Order Model
- Order details and items
- Customer and shipping information
- Payment and status tracking
- Commission trigger events

## MLM Business Logic

### Binary Tree Structure
- Each user can have two positions: left and right
- Automatic commission calculations based on tree structure
- Level-based commission distribution

### Commission Types
1. **Direct Commission**: Earned from direct referrals
2. **Binary Commission**: Earned from binary tree structure
3. **Matching Commission**: Earned from matching pairs
4. **Leadership Commission**: Earned from team performance

### Genealogy Management
- Automatic tree building and maintenance
- Position assignment and validation
- Network visualization and analytics

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS configuration
- Helmet security headers

## Development

### Project Structure
```
mlm-system/
├── server/                 # Backend application
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions
│   └── index.js           # Server entry point
├── client/                # Frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── hooks/         # Custom hooks
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
└── package.json           # Root package configuration
```

### Scripts
- `npm run dev` - Start both frontend and backend in development mode
- `npm run server` - Start backend server only
- `npm run client` - Start frontend development server
- `npm run build` - Build frontend for production
- `npm run install-all` - Install dependencies for all packages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository or contact the development team.

## Roadmap

- [ ] Advanced analytics and reporting
- [ ] Mobile application
- [ ] Payment gateway integration
- [ ] Email notifications
- [ ] Multi-language support
- [ ] Advanced commission structures
- [ ] Inventory management
- [ ] Customer portal
