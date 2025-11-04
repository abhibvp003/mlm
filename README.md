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

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### GitHub Repository
- **Repository URL**: https://github.com/abhibvp003/mlm.git
- **Clone the repository**:
  ```bash
  git clone https://github.com/abhibvp003/mlm.git
  cd mlm
  ```

### Installation

1. **Install dependencies**
   ```bash
   npm run install-all
   ```

2. **Environment Configuration**
   
   Copy the example environment file and configure it:
   ```bash
   cd server
   cp config.env.example config.env
   ```
   
   Edit `server/config.env` with your configuration:
   ```env
   PORT=5001
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mlm_system?retryWrites=true&w=majority&appName=mlm
   JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   
   # Email Configuration (optional)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

3. **MongoDB Atlas Setup** (Recommended)
   - Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a new cluster
   - Add your IP address to the Network Access list
   - Create a database user
   - Get your connection string and update `MONGODB_URI` in `config.env`

4. **Create Initial Users** (Optional)
   ```bash
   cd server
   node utils/createUsers.js
   ```
   This creates:
   - Admin: `admin@mlm.com` / `admin123`
   - Abhishek: `abhishek@mlm.com` / `abhishek123`
   - Birendra: `birendra@mlm.com` / `birendra123`

5. **Run the application**
   ```bash
   # Development mode (runs both frontend and backend)
   npm run dev
   
   # Or run separately:
   npm run server  # Backend only
   npm run client  # Frontend only
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

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

## 🚀 Deployment

This is a full-stack application that requires separate deployment for frontend and backend.

### Deployment Options

#### Option 1: Vercel (Frontend) + Railway (Backend) - Recommended

**Frontend on Vercel:**
1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com) and import your repository
3. Set root directory to `client`
4. Build command: `npm run build`
5. Output directory: `build`
6. Add environment variable: `REACT_APP_API_URL` = your backend URL

**Backend on Railway:**
1. Go to [Railway](https://railway.app) and create a new project
2. Connect your GitHub repository
3. Set root directory to `server`
4. Add environment variables from `config.env`
5. Railway will automatically deploy and provide a URL

#### Option 2: Netlify (Frontend) + Render (Backend)

**Frontend on Netlify:**
1. Push code to GitHub
2. Go to [Netlify](https://netlify.com) and import repository
3. Base directory: `client`
4. Build command: `npm run build`
5. Publish directory: `client/build`

**Backend on Render:**
1. Go to [Render](https://render.com) and create a new Web Service
2. Connect GitHub repository
3. Root directory: `server`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables

#### Option 3: GitHub Pages (Frontend) + Heroku (Backend)

**Frontend on GitHub Pages:**
1. Build the frontend: `cd client && npm run build`
2. Push `build` folder to `gh-pages` branch
3. Enable GitHub Pages in repository settings

**Backend on Heroku:**
1. Create a Heroku app
2. Set buildpacks and environment variables
3. Deploy using Git or Heroku CLI

### Environment Variables for Deployment

**Backend (Server):**
- `PORT` - Server port (usually auto-set by hosting platform)
- `MONGODB_URI` - Your MongoDB Atlas connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Set to `production`
- `FRONTEND_URL` - Your frontend deployment URL
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` - Email configuration

**Frontend (Client):**
- `REACT_APP_API_URL` - Your backend API URL (e.g., `https://your-backend.railway.app`)

### MongoDB Atlas Configuration

For production:
1. Create a production cluster in MongoDB Atlas
2. Add `0.0.0.0/0` to Network Access (or specific IPs of your hosting providers)
3. Create a production database user
4. Update `MONGODB_URI` with production credentials

### Quick Deploy Script

After deploying, you can create users by running:
```bash
cd server
node utils/createUsers.js
```

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
