# EduPlatform - Educational Testing Platform

A comprehensive educational platform built with Django REST API backend and React frontend, featuring separate dashboards for students, teachers, and administrators.

## 🚀 Features

### For Students
- **Dashboard Overview**: Performance analytics, pending tests, and completion statistics
- **Test Taking**: Interactive test interface with timer and progress tracking
- **Results Tracking**: Detailed score history and performance trends
- **Grade Analytics**: Visual charts showing performance over time

### For Teachers
- **Test Creation**: Advanced test creator with multiple choice questions
- **Student Management**: Assign tests to specific students
- **Performance Monitoring**: Track student progress and class averages
- **Result Analytics**: Detailed insights into student performance

### For Administrators
- **Platform Overview**: System-wide statistics and user analytics
- **User Management**: Monitor all users across the platform
- **System Health**: Platform activity and performance metrics
- **Advanced Analytics**: Comprehensive reporting and insights

## 🛠 Technology Stack

### Backend
- **Django 4.2.7** - Web framework
- **Django REST Framework** - API development
- **SQLite** - Database (easily configurable to PostgreSQL/MySQL)
- **JWT Authentication** - Secure user authentication
- **Django CORS Headers** - Cross-origin resource sharing

### Frontend
- **React 18.2** - UI library
- **React Router** - Client-side routing
- **Recharts** - Data visualization
- **Lucide React** - Icon library
- **Axios** - HTTP client

## 📁 Project Structure

```
eduplatform/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── eduplatform/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── apps/
│       ├── users/          # User management & authentication
│       ├── tests/          # Test creation & management
│       └── analytics/      # Dashboard statistics
├── frontend/
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── components/     # Reusable components
│       ├── pages/         # Main page components
│       ├── services/      # API services
│       ├── context/       # React contexts
│       └── styles/        # Global styles
└── README.md
```

## 🚦 Getting Started

### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Create virtual environment**
```bash
python -m venv venv
```

3. **Activate virtual environment**
```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

4. **Install dependencies**
```bash
pip install -r requirements.txt
```

5. **Run migrations**
```bash
python manage.py makemigrations
python manage.py migrate
```

6. **Create superuser (admin)**
```bash
python manage.py createsuperuser
```

7. **Start development server**
```bash
python manage.py runserver
```

Backend will be running at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm start
```

Frontend will be running at `http://localhost:3000`

## 🎨 Design Features

### Color Scheme
- **Primary Green**: #10B981 (Emerald 500)
- **Light Green**: #D1FAE5 (Emerald 100)  
- **Dark Green**: #065F46 (Emerald 900)
- **White**: #FFFFFF
- **Gray Accents**: Various shades for subtle UI elements

### UI Components
- **Modern Sidebar Navigation**: Role-based menu items with smooth animations
- **Interactive Dashboards**: Real-time statistics with beautiful charts
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Loading States**: Smooth loading animations throughout the app
- **Status Indicators**: Color-coded badges for test status and user types

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/register/` - User registration
- `POST /api/auth/refresh/` - Token refresh
- `GET /api/auth/profile/` - Get user profile

### Tests
- `GET /api/tests/` - List tests
- `POST /api/tests/` - Create test
- `GET /api/tests/{id}/` - Get test details
- `POST /api/tests/assign/` - Assign test to students
- `GET /api/tests/assignments/` - List assignments
- `POST /api/tests/attempts/create/` - Submit test attempt

### Analytics
- `GET /api/analytics/dashboard-stats/` - Dashboard statistics

## 👥 User Roles & Permissions

### Student
- Take assigned tests
- View personal performance analytics
- Access test history and results
- View upcoming and completed assignments

### Teacher  
- Create and manage tests
- Assign tests to students
- Monitor student performance
- View class analytics and insights

### Administrator
- Monitor platform-wide activity
- Manage all users and tests
- Access system analytics
- Configure platform settings

## 🔒 Security Features

- **JWT Authentication** with access and refresh tokens
- **Role-based access control** for different user types
- **CORS protection** for cross-origin requests
- **Input validation** on all forms
- **Secure password requirements**

## 🎯 Key Functionalities

### Test Creation
- Multiple choice questions with 4 options
- Configurable time limits and difficulty levels
- Automatic scoring and grading
- Question ordering and point allocation

### Dashboard Analytics
- Performance trends over time
- Completion rates and averages
- Interactive charts and visualizations
- Real-time statistics updates

### Test Taking Experience
- Clean, distraction-free interface
- Progress tracking and time management
- Instant feedback and results
- Responsive design for all devices

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the backend directory:
```
SECRET_KEY=your-secret-key-here
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3
```

### Database Configuration
The project uses SQLite by default. To use PostgreSQL or MySQL:

1. Install the appropriate database driver
2. Update `DATABASES` in `settings.py`
3. Run migrations

## 📈 Performance Optimization

- **Lazy Loading**: Components load only when needed
- **API Optimization**: Efficient database queries with select_related
- **Caching**: Browser caching for static assets
- **Compression**: Minified CSS and JavaScript in production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the API documentation at `/api/docs/` when server is running

## 🚀 Deployment

### Production Deployment
1. Set `DEBUG=False` in settings
2. Configure production database
3. Set up static file serving
4. Use environment variables for sensitive data
5. Deploy using services like Heroku, DigitalOcean, or AWS

### Docker Deployment (Optional)
Docker configuration files can be added for containerized deployment.

---

**EduPlatform** - Empowering education through technology 🎓