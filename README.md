# Hospital Management System (HMS)

A complete and fully functional Hospital Management System built with MERN stack (MongoDB, Express.js, React.js, Node.js).

## Features

### 🔐 Authentication & Authorization
- Patient self-registration
- Staff/Doctor/HR created by Admin only
- JWT Token authentication
- Role-Based Access Control (RBAC)
- Separate dashboards for each role
- Forgot Password (OTP/Email reset)

### 👤 Roles
1. **Patient** - Can book appointments, view reports, prescriptions, payments
2. **Doctor** - Manage appointments, patient records, prescriptions, lab reports
3. **Staff** - Receptionist, Nurse, Lab Staff, Ward Staff with specific permissions
4. **HR** - Staff management, salary preparation
5. **Admin/Owner** - Full system control, user management, finance reports

### 📋 Core Modules
- **Appointment System** - Booking, scheduling, token system
- **Patient Management** - Profiles, medical records, emergency contacts
- **Doctor Management** - Availability, schedules, consultation fees
- **Room/Bed Management** - Room assignment, discharge process
- **Medicine Management** - Medicine database, schedules, nurse tracking
- **Payment System** - Multiple payment modes (UPI, Card, Cash, Net Banking)
- **Lab Reports** - Upload, view, and manage test reports
- **Salary Management** - HR prepares, Admin approves and pays
- **Audit Logs** - Track all system changes

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation & Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd HMS
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
# Edit .env file with your configuration:
# MONGODB_URI=mongodb://localhost:27017/hms
# PORT=5000
# JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=your_email@gmail.com
# EMAIL_PASS=your_email_password
# FRONTEND_URL=http://localhost:3000

# Start MongoDB (if not running)
# Windows: Make sure MongoDB service is running
# Mac/Linux: mongod

# Start backend server
npm start
# or for development with auto-reload
npm run dev
```

### 3. Frontend Setup

```bash
# Open a new terminal, navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start React development server
npm start
```

The frontend will run on `http://localhost:3000` and backend on `http://localhost:5000`

## Environment Variables

### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/hms
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
FRONTEND_URL=http://localhost:3000
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Patient registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Patient Routes
- `GET /api/patient/profile` - Get patient profile
- `PUT /api/patient/profile` - Update patient profile
- `GET /api/patient/appointments` - Get patient appointments
- `GET /api/patient/doctors` - Get available doctors
- `GET /api/patient/reports` - Get patient reports
- `GET /api/patient/prescriptions` - Get prescriptions
- `GET /api/patient/medicine-schedule` - Get medicine schedule
- `GET /api/patient/payments` - Get payment history

### Doctor Routes
- `GET /api/doctor/profile` - Get doctor profile
- `PUT /api/doctor/profile` - Update doctor profile
- `GET /api/doctor/appointments` - Get doctor appointments
- `PUT /api/doctor/appointments/:id/status` - Update appointment status
- `POST /api/doctor/patient-record` - Create/Update patient record
- `GET /api/doctor/patient-records` - Get patient records
- `POST /api/doctor/admit-patient` - Admit patient
- `POST /api/doctor/request-lab-test` - Request lab test
- `GET /api/doctor/lab-reports` - Get lab reports

### Staff Routes
- `POST /api/staff/patient-entry` - Add walk-in patient
- `GET /api/staff/rooms` - Get all rooms
- `POST /api/staff/assign-room` - Assign room/bed
- `POST /api/staff/discharge` - Discharge patient
- `GET /api/staff/medicine-schedules` - Get medicine schedules
- `PUT /api/staff/medicine-schedule/:id/mark-given` - Mark medicine as given
- `POST /api/staff/upload-report` - Upload lab report
- `POST /api/staff/cash-payment` - Record cash payment

### HR Routes
- `GET /api/hr/staff` - Get all staff
- `GET /api/hr/doctors` - Get all doctors
- `POST /api/hr/salary` - Create salary record
- `GET /api/hr/salaries` - Get all salary records
- `PUT /api/hr/salary/:id` - Update salary record

### Admin Routes
- `POST /api/admin/create-user` - Create user (Doctor/Staff/HR)
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Deactivate user
- `GET /api/admin/dashboard` - Get dashboard stats
- `GET /api/admin/appointments` - Get all appointments
- `GET /api/admin/payments` - Get all payments
- `PUT /api/admin/salary/:id/approve` - Approve salary
- `PUT /api/admin/salary/:id/mark-paid` - Mark salary as paid

### Appointments
- `POST /api/appointments/book` - Book appointment
- `GET /api/appointments/available-slots` - Get available time slots
- `PUT /api/appointments/:id/cancel` - Cancel appointment
- `GET /api/appointments` - Get appointments

### Rooms
- `POST /api/rooms` - Create room (Admin)
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/:id` - Get room by ID
- `PUT /api/rooms/:id` - Update room
- `DELETE /api/rooms/:id` - Delete room

### Medicines
- `POST /api/medicines` - Create medicine (Admin)
- `GET /api/medicines` - Get all medicines
- `GET /api/medicines/:id` - Get medicine by ID
- `PUT /api/medicines/:id` - Update medicine
- `DELETE /api/medicines/:id` - Delete medicine
- `POST /api/medicines/schedule` - Create medicine schedule

### Payments
- `POST /api/payments` - Create payment
- `GET /api/payments` - Get payments
- `GET /api/payments/:id` - Get payment by ID
- `PUT /api/payments/:id/status` - Update payment status

### Reports
- `GET /api/reports` - Get reports
- `GET /api/reports/:id` - Get report by ID

## Default Admin Account

To create the first admin account, you can either:

1. Use MongoDB shell:
```javascript
use hms
db.users.insertOne({
  name: "Admin",
  email: "admin@hms.com",
  password: "$2a$10$...", // bcrypt hash of "admin123"
  role: "admin",
  phone: "1234567890",
  isActive: true
})
```

2. Or modify the backend to allow first admin registration (temporary)

## Testing with Postman

Import the `HMS_Postman_Collection.json` file into Postman to test all API endpoints.

## Project Structure

```
HMS/
├── backend/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth & validation middleware
│   ├── uploads/         # File uploads directory
│   ├── server.js        # Express server
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── context/     # Context API
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## Features by Role

### Patient
- ✅ Book appointments
- ✅ View doctor availability
- ✅ View appointments
- ✅ Cancel appointments
- ✅ View reports & prescriptions
- ✅ View medicine schedule
- ✅ Make payments (UPI/Card)
- ✅ View payment history

### Doctor
- ✅ Manage profile & availability
- ✅ View appointments
- ✅ Approve/Reschedule/Cancel appointments
- ✅ Add patient treatment records
- ✅ Prescribe medicines
- ✅ Request lab tests
- ✅ View lab reports
- ✅ Admit patients
- ✅ Add daily notes

### Staff
- ✅ Receptionist: Patient entry, cash payments
- ✅ Nurse: Medicine schedule management
- ✅ Lab Staff: Upload lab reports
- ✅ Ward Staff: Room/bed management, discharge

### HR
- ✅ View staff & doctor records
- ✅ Create salary records
- ✅ Manage salary structure

### Admin
- ✅ Create users (Doctor/Staff/HR)
- ✅ Manage all users
- ✅ View dashboard with stats
- ✅ Manage appointments
- ✅ View all payments
- ✅ Manage rooms
- ✅ Manage medicines
- ✅ Approve & pay salaries

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation
- Audit logging
- Secure file uploads

## Technologies Used

- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Frontend**: React.js, React Router, Axios
- **Authentication**: JWT, bcryptjs
- **File Upload**: Multer
- **Date Handling**: Moment.js

## License

ISC

## Support

For issues and questions, please create an issue in the repository.

