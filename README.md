# LUCT Reporting System

A modern, role-based academic reporting system built for Limkokwing University College of Technology (LUCT). This system streamlines the process of managing classes, submitting reports, and monitoring academic activities across different user roles.

## 🎯 Overview

The LUCT Reporting System is a full-stack web application that enables:

- **Admins** to manage users, faculties, programs, and courses
- **Program Leaders** to monitor programs and export reports
- **Principal Lecturers** to review ratings and quality metrics
- **Lecturers** to submit teaching reports and track classes
- **Students** to enroll in classes and rate lectures

## 🏗️ Architecture

### Tech Stack

**Frontend:**

- React 18 with Vite
- React Router for navigation
- Context API for state management
- Lucide React for icons
- Date-fns for date formatting
- CSS with custom properties (dark theme)

**Backend:**

- Node.js with Express
- MySQL database
- JWT authentication
- bcrypt for password hashing
- XLSX & PDFKit for exports

### Project Structure

```
Reporting/
├── backend/
│   ├── src/
│   │   ├── app.js              # Express app configuration
│   │   ├── server.js           # Server entry point
│   │   ├── config/
│   │   │   └── env.js          # Environment configuration
│   │   ├── db/
│   │   │   ├── pool.js         # MySQL connection pool
│   │   │   ├── schema.sql      # Database schema
│   │   │   └── migrations.sql  # Database migrations
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.js
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── adminRoutes.js
│   │   │   ├── plRoutes.js     # Program Leader routes
│   │   │   ├── prlRoutes.js    # Principal Lecturer routes
│   │   │   ├── lecturerRoutes.js
│   │   │   ├── studentRoutes.js
│   │   │   └── exportRoutes.js
│   │   └── utils/
│   │       └── exportUtils.js  # Export utilities
│   └── package.json
│
├── frontend/
│   └── luct-reporting/
│       ├── src/
│       │   ├── main.jsx
│       │   ├── App.jsx
│       │   ├── components/
│       │   │   ├── layout/     # AppShell, Sidebar, Topbar
│       │   │   └── ui/         # Reusable UI components
│       │   ├── context/
│       │   │   └── AuthContext.jsx
│       │   ├── pages/
│       │   │   ├── admin/      # Admin workspace
│       │   │   ├── auth/       # Login & Register
│       │   │   ├── classes/    # Class management
│       │   │   ├── dashboard/  # Role-based dashboards
│       │   │   ├── monitoring/ # Monitoring views
│       │   │   ├── programs/   # Program views
│       │   │   ├── ratings/    # Ratings & feedback
│       │   │   └── reports/    # Report management
│       │   ├── services/
│       │   │   └── api.js      # API client
│       │   └── styles/
│       │       └── theme.css   # Global dark theme
│       ├── index.html
│       ├── vite.config.js
│       └── package.json
│
├── USER_GUIDE.md               # Complete user documentation
└── README.md                   # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Reporting
   ```

2. **Setup Backend**

   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment**

   Create a `.env` file in the `backend` directory:

   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=your_mysql_user
   DB_PASSWORD=your_mysql_password
   DB_NAME=luct_reporting
   JWT_SECRET=your_jwt_secret_key_here
   NODE_ENV=development
   ```

4. **Setup Database**

   Run the schema and migrations:

   ```bash
   # Using MySQL CLI
   mysql -u root -p < src/db/schema.sql

   # Or run the setup script
   node src/db/setupDatabase.js
   ```

5. **Setup Frontend**
   ```bash
   cd frontend/luct-reporting
   npm install
   ```

### Running the Application

1. **Start Backend Server**

   ```bash
   cd backend
   npm start
   ```

   Server will run on `http://localhost:5000`

2. **Start Frontend Development Server**
   ```bash
   cd frontend/luct-reporting
   npm run dev
   ```
   App will run on `http://localhost:5173`

## 👥 Demo Accounts

Use these credentials to test different roles:

| Role               | Email                        | Password  |
| ------------------ | ---------------------------- | --------- |
| Admin              | admin@luct.ac.ls             | admin123  |
| Program Leader     | naledi.molefe@luct.ac.ls     | secure123 |
| Principal Lecturer | thabo.makoanyane@luct.ac.ls  | secure123 |
| Lecturer           | boitumelo.tebello@luct.ac.ls | secure123 |
| Student            | lerato.sechele@luct.ac.ls    | learn123  |

## 🎨 Key Features

### 🔐 Authentication & Authorization

- JWT-based authentication
- Role-based access control (RBAC)
- Protected routes and API endpoints
- Admin approval workflow for new users

### 📊 Admin Workspace

- User management (approve/reject registrations)
- Faculty, program, and course management
- Lecturer-to-class assignments
- Registration code generation
- System-wide search
- Analytics dashboard
- Audit logs
- Data export (CSV, Excel, PDF)

### 📚 Program Leader Features

- Faculty-level program overview
- Report monitoring with search/filter
- Export reports in multiple formats
- Class and lecturer tracking

### ⭐ Principal Lecturer Features

- All Program Leader capabilities
- Student ratings and feedback review
- Quality assurance monitoring

### 📝 Lecturer Features

- Class schedule management
- Report submission workflow
- Attendance tracking
- Topic and learning outcomes documentation

### 🎓 Student Features

- Class enrollment with search/filter
- View enrolled classes
- Access lecturer reports
- Withdraw from classes

### 🔍 Search & Filter

- Real-time search across all pages
- Multiple filter criteria
- Search by name, code, topic, etc.
- Status and level filters

### 📤 Export Capabilities

- CSV export for spreadsheets
- Excel (XLSX) format
- PDF generation for printing
- Filtered exports

### 🎨 UI/UX

- Modern dark theme
- Fully responsive design
- Mobile-friendly interface
- Accessible components
- Consistent design system

## 📁 Database Schema

Key tables:

- `users` - User accounts with roles
- `faculties` - Academic faculties
- `programs` - Academic programs
- `courses` - Course catalog
- `classes` - Class instances
- `reports` - Lecturer reports
- `student_enrollments` - Class enrollments
- `ratings` - Student feedback
- `registration_codes` - Signup codes
- `export_logs` - Export activity tracking
- `audit_logs` - System activity logs

## 🔧 Development

### Available Scripts

**Backend:**

```bash
npm start          # Start server
npm run dev        # Start with nodemon (auto-reload)
npm test           # Run tests
```

**Frontend:**

```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

### Environment Variables

**Backend:**

- `PORT` - Server port (default: 5000)
- `DB_HOST` - MySQL host
- `DB_USER` - MySQL username
- `DB_PASSWORD` - MySQL password
- `DB_NAME` - Database name
- `JWT_SECRET` - Secret for JWT signing
- `NODE_ENV` - Environment (development/production)

**Frontend:**

- API base URL is configured in `src/services/api.js`

## 📖 Documentation

- [USER_GUIDE.md](USER_GUIDE.md) - Complete user guide for all roles
- [Database Schema](backend/src/db/SCHEMA_REFERENCE.md) - Database documentation
- [API Documentation](backend/src/routes/) - API route documentation

## 🐛 Troubleshooting

### Backend won't start

- Check MySQL is running
- Verify database credentials in `.env`
- Ensure database schema is created
- Check port 5000 is not in use

### Frontend won't connect

- Verify backend is running on port 5000
- Check API configuration in `api.js`
- Clear browser cache
- Check browser console for errors

### Database errors

- Run migrations: `node src/db/runMigrations.js`
- Verify schema: `node src/db/verifyMigrations.js`
- Check MySQL user permissions

## 🔒 Security

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- Protected API routes with middleware
- SQL injection prevention with prepared statements
- CORS configuration for API security
- Input validation and sanitization

## 🚧 Future Enhancements

- [ ] Email notifications
- [ ] Real-time updates with WebSockets
- [ ] Advanced analytics dashboard
- [ ] Bulk operations for admin
- [ ] Mobile app version
- [ ] API documentation with Swagger
- [ ] Automated testing suite
- [ ] Performance monitoring

## 📄 License

This project is proprietary software developed for Limkokwing University of Creative Technology.

## 👨‍💻 Support

For technical support or questions:

- Check the [USER_GUIDE.md](USER_GUIDE.md)
- Review database documentation
- Contact system administrator

---

**Version:** 1.0  
**Last Updated:** October 2025  
**Built for:** Limkokwing University of Creative Technology (LUCT)
