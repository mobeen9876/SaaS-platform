# SaaS Platform - Complete Full-Stack Application

A comprehensive SaaS platform built with React frontend and Node.js/Express backend, featuring user management, admin dashboard, real-time monitoring, and email notifications.

## 🚀 Features Completed

### ✅ User Authentication & Registration

- **User Registration with Admin Approval**: New users register and wait for admin approval
- **OTP-Based Password Reset**: Secure 6-digit OTP sent via email for password recovery
- **JWT Authentication**: Secure token-based authentication system
- **Role-Based Access Control**: User and Admin roles with different permissions

### ✅ Admin Dashboard & Management

- **User Management**: Complete CRUD operations for user accounts
- **Registration Approval System**: Approve/reject pending user registrations
- **Real-time System Monitoring**: Live CPU, memory, disk, and network monitoring
- **Admin Password Reset**: Admins can reset any user's password
- **Registration Status Management**: Dropdown to change user registration status
- **Revenue Analytics**: Monthly revenue, subscriptions, and conversion tracking

### ✅ User Dashboard & Profile

- **Dynamic User Dashboard**: Real-time API usage, storage, and project statistics
- **Profile Management**: Users can update their profile information
- **Plan Management**: View current plan details and usage limits
- **Activity Tracking**: Recent user activity and quick access links

### ✅ Email Notification System

- **Welcome Emails**: Sent when user registration is approved
- **Rejection Emails**: Sent when user registration is rejected with reason
- **OTP Emails**: Professional HTML templates for password reset
- **Fake SMTP Testing**: Uses Ethereal Email for development testing

### ✅ Real-time Features

- **Live System Monitoring**: Real-time charts and metrics for admins
- **Dynamic Data Updates**: Auto-refreshing user statistics and system health
- **Alert System**: Real-time system alerts and notifications
- **Performance Metrics**: Response time, error rate, and throughput monitoring

## 🛠️ Technology Stack

### Frontend

- **React 18** with Vite
- **React Router** for navigation
- **CSS Modules** for styling
- **React Icons** for UI icons
- **SweetAlert2** for beautiful alerts

### Backend

- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Nodemailer** for email services
- **bcryptjs** for password hashing

## 📦 Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Git

### 1. Clone the Repository

```bash
git clone <repository-url>
cd saas-platform
```

### 2. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies (if separate)
cd frontend && npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/saas-platform

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# Email Configuration (for development)
EMAIL_SERVICE=ethereal
ETHEREAL_USER=your-ethereal-user
ETHEREAL_PASS=your-ethereal-pass

# For production with Gmail
# EMAIL_SERVICE=gmail
# EMAIL_USER=your-gmail@gmail.com
# EMAIL_PASS=your-app-password

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Frontend API base URL (used by React/Vite)
# note: variable name changed from VITE_API_BASE_URL to VITE_API_URL

# Frontend API base URL (used by React/Vite)
VITE_API_URL=http://localhost:3000

# Server
PORT=3000
NODE_ENV=development
```

### 4. Database Setup

```bash
# Start MongoDB (if running locally)
mongod

# The application will create collections automatically
```

### 5. Run the Application

```bash
# Start backend server
npm start

# Start frontend (if separate)
cd frontend && npm run dev
```

## 🔧 Usage Guide

### For Regular Users

1. **Register**: Create an account (requires admin approval)
2. **Wait for Approval**: Admin will approve/reject your registration
3. **Login**: Access your dashboard after approval
4. **Dashboard**: View API usage, storage, and manage projects
5. **Profile**: Update personal information and change password
6. **Password Reset**: Use "Forgot Password" with OTP verification

### For Administrators

1. **Admin Login**: Login with admin credentials
2. **User Management**: View, edit, activate/deactivate users
3. **Registration Approval**: Approve or reject pending registrations
4. **System Monitoring**: Real-time system health and performance
5. **Password Management**: Reset passwords for any user
6. **Analytics**: View revenue and user conversion metrics

## 📧 Email System

### Development Testing

- Uses **Ethereal Email** (fake SMTP) for testing
- OTP codes are logged to console
- Preview URLs provided for email content
- No real emails sent in development

### Production Setup

- Configure Gmail with App Password
- Update EMAIL_SERVICE to "gmail" in .env
- Add your Gmail credentials
- Real emails will be sent

### Email Templates

- **Welcome Email**: Sent on registration approval
- **Rejection Email**: Sent on registration rejection
- **OTP Email**: Sent for password reset requests

## 🔐 Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Tokens**: Secure authentication tokens
- **Rate Limiting**: OTP request limiting (5 attempts)
- **Input Validation**: Server-side validation for all inputs
- **Role-Based Access**: Admin-only routes and features
- **CORS Protection**: Configured for frontend domain

## 📊 Admin Features

### User Management

- View all registered users
- Change user roles (User ↔ Admin)
- Update user plans (Free, Pro, Enterprise)
- Activate/deactivate user accounts
- Delete user accounts
- Reset user passwords

### Registration Management

- View pending registration requests
- Approve registrations (sends welcome email)
- Reject registrations (sends rejection email with reason)
- Update registration status via dropdown

### System Monitoring

- Real-time CPU, Memory, Disk usage
- Network traffic monitoring
- API request tracking
- System alerts and logs
- Server cluster status
- Performance metrics

### Analytics

- Total users and active users
- Plan distribution (Free, Pro, Enterprise)
- Conversion rates
- Monthly revenue tracking
- User growth metrics

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern Interface**: Clean, professional design
- **Real-time Updates**: Live data without page refresh
- **Interactive Charts**: Visual system monitoring
- **Beautiful Alerts**: SweetAlert2 for user feedback
- **Loading States**: Smooth loading indicators
- **Error Handling**: User-friendly error messages

## 🧪 Testing

### Email Testing

```bash
# Run email test script
node test-email.js
```

### Manual Testing Checklist

- [ ] User registration and approval flow
- [ ] Password reset with OTP
- [ ] Admin user management
- [ ] Registration status changes
- [ ] Email notifications
- [ ] Real-time dashboard updates
- [ ] Profile management
- [ ] System monitoring

## 🚀 Deployment

### Backend Deployment

1. Set production environment variables
2. Configure production MongoDB
3. Set up production email service
4. Deploy to your preferred platform (Heroku, AWS, etc.)

### Frontend Deployment

1. Build the React app: `npm run build`
2. Deploy to static hosting (Netlify, Vercel, etc.)
3. Update CORS settings in backend

## 📝 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset OTP
- `POST /api/auth/reset-password` - Reset password with OTP

### Admin Routes

- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/role` - Update user role
- `PUT /api/admin/users/:id/plan` - Update user plan
- `PUT /api/admin/users/:id/registration-status` - Update registration status
- `POST /api/admin/reset-user-password` - Admin reset user password
- `GET /api/admin/pending-registrations` - Get pending registrations
- `PUT /api/admin/registrations/:id/approve` - Approve registration
- `PUT /api/admin/registrations/:id/reject` - Reject registration

### User Routes

- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `POST /api/user/change-password` - Change password

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Check the documentation above
- Review the code comments
- Test with the provided email testing script
- Ensure all environment variables are set correctly

---

**Project Status**: ✅ **COMPLETE** - All features implemented and tested!
