# IT Proctool - Complete Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [User Roles & Access](#user-roles--access)
3. [Core Features](#core-features)
4. [Security Features](#security-features)
5. [Technical Specifications](#technical-specifications)
6. [Installation & Setup](#installation--setup)
7. [User Guides](#user-guides)
8. [API Documentation](#api-documentation)
9. [Database Schema](#database-schema)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 System Overview

**IT Proctool** is a comprehensive online proctoring system designed to monitor students during form-based examinations in real-time. The system automatically detects cheating behaviors, alerts teachers instantly, and maintains detailed logs of all activities.

### Key Objectives:
- Ensure exam integrity through real-time monitoring
- Provide seamless form integration (Google Forms, Typeform, etc.)
- Offer role-based access for students, teachers, and administrators
- Maintain comprehensive audit trails and violation logs

---

## 👥 User Roles & Access

### 🎓 **Student Role**
**Access**: Public login with Student ID
**URL**: `http://localhost:3000/`

#### Features:
- View available exams
- Take proctored examinations
- Access embedded forms (Google Forms, Typeform, etc.)
- Real-time violation feedback
- Exam session tracking

#### Restrictions:
- Cannot access teacher or admin areas
- Limited to assigned examinations only
- Monitored during active exam sessions

### 👨‍🏫 **Teacher Role**
**Access**: Email/password authentication
**URL**: `http://localhost:3000/` (Teacher tab)
**Demo Credentials**: `teacher@cec.edu` / `teacher123`

#### Features:
- **Exam Management**:
  - Create new exams with form integration
  - Set exam duration and scheduling
  - Configure proctoring settings
  - Edit and manage existing exams

- **Real-time Monitoring**:
  - Live student activity tracking
  - Instant violation alerts
  - Student status monitoring (active/flagged/completed)
  - Time remaining tracking

- **Reporting & Analytics**:
  - Detailed violation logs
  - Student performance tracking
  - Exam session reports
  - Violation severity classification

- **Settings Management**:
  - Configure detection sensitivity
  - Set violation thresholds
  - Customize alert preferences
  - Manage proctoring rules

### 🔐 **Administrator Role**
**Access**: Secure hidden portal
**URL**: `http://localhost:3000/admin/secure-portal`
**Demo Credentials**: `admin@cec.edu` / `SecureAdmin2024!`

#### Features:
- **User Management**:
  - Add, edit, delete student accounts
  - Manage teacher accounts and permissions
  - Bulk user operations
  - Account status management (active/suspended)

- **System Administration**:
  - Global system settings configuration
  - Security parameter management
  - Database maintenance
  - System performance monitoring

- **Advanced Reporting**:
  - System-wide activity logs
  - Security event monitoring
  - User access reports
  - Violation trend analysis

- **Security Management**:
  - Brute force protection settings
  - Session timeout configuration
  - Access control management
  - Audit trail maintenance

---

## 🔍 Core Features

### 📊 **Real-time Proctoring**

#### **Cheating Detection**:
1. **Tab Switching Detection**
   - Monitors browser tab changes
   - Detects window minimization
   - Tracks application switching

2. **Fullscreen Enforcement**
   - Automatic fullscreen activation
   - Exit detection and prevention
   - Violation logging for exits

3. **Inactivity Monitoring**
   - Tracks mouse and keyboard activity
   - Configurable timeout periods (default: 5 minutes)
   - Automatic flagging for extended inactivity

4. **Keyboard Shortcut Blocking**
   - Prevents Alt+Tab usage
   - Blocks Ctrl+T, Ctrl+N, Ctrl+W
   - Disables F12 and developer tools access
   - Prevents right-click context menus

5. **Activity Tracking**
   - Real-time activity monitoring
   - Last activity timestamps
   - Behavioral pattern analysis

#### **Violation Response System**:
- **Immediate Response**: Black warning screen display
- **Temporary Blocking**: Exam form becomes inaccessible
- **Teacher Alerts**: Instant notifications to teacher dashboard
- **Automatic Logging**: All violations stored with timestamps
- **Severity Classification**: Low, medium, high severity levels

### 📝 **Form Integration**

#### **Supported Platforms**:
- Google Forms
- Typeform
- Microsoft Forms
- Custom HTML/PHP forms
- Any embeddable form platform

#### **Integration Features**:
- Seamless iframe embedding
- Preserved form styling and functionality
- Secure sandbox environment
- Cross-origin resource sharing (CORS) handling

### 📈 **Dashboard & Monitoring**

#### **Student Dashboard**:
- Available exam listings
- Exam status indicators (upcoming/active/completed)
- Proctoring notices and warnings
- Exam access controls

#### **Teacher Dashboard**:
- **Live Monitoring Tab**:
  - Real-time student activity
  - Active exam sessions
  - Violation alerts and counts
  - Time remaining displays

- **Violations Log Tab**:
  - Detailed violation history
  - Student-specific violation tracking
  - Timestamp and description logging
  - Severity-based filtering

- **Exam Management Tab**:
  - Created exam listings
  - Exam status management
  - Quick edit and view options
  - Performance analytics

- **Settings Tab**:
  - Proctoring rule configuration
  - Detection sensitivity settings
  - Alert threshold management
  - Notification preferences

#### **Admin Dashboard**:
- **Student Management**: Complete CRUD operations
- **Teacher Management**: Account and permission control
- **System Logs**: Comprehensive activity monitoring
- **Configuration**: Global system settings

---

## 🛡️ Security Features

### **Authentication & Authorization**:
- Role-based access control (RBAC)
- Secure password hashing
- Session management and timeouts
- Brute force protection

### **Admin Portal Security**:
- Hidden from public access (no UI links)
- Direct URL access only
- Strong password requirements
- Activity logging and monitoring
- Session timeout enforcement

### **Exam Security**:
- Fullscreen enforcement
- Tab switching prevention
- Keyboard shortcut blocking
- Right-click disabling
- Developer tools blocking

### **Data Protection**:
- Encrypted data transmission
- Secure session tokens
- Audit trail maintenance
- Privacy compliance measures

---

## 💻 Technical Specifications

### **Frontend Technology Stack**:
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **State Management**: React Hooks
- **Form Handling**: React Hook Form
- **Notifications**: Sonner/Toast

### **Backend Technology Stack**:
- **Runtime**: Next.js API Routes
- **Database**: MySQL (via XAMPP)
- **ORM**: Raw SQL queries
- **Authentication**: Custom JWT implementation
- **Session Management**: Local storage + server validation

### **Browser Compatibility**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### **System Requirements**:
- Node.js 16.0 or higher
- 4GB RAM minimum
- 1GB storage space
- Stable internet connection

---

## 🚀 Installation & Setup

### **Prerequisites**:
\`\`\`bash
# Install Node.js (v16+)
# Download from: https://nodejs.org/

# Install XAMPP for MySQL
# Download from: https://www.apachefriends.org/
\`\`\`

### **Installation Steps**:

1. **Clone/Download Project**:
\`\`\`bash
# Extract project files to desired directory
cd path/to/it-proctool
\`\`\`

2. **Install Dependencies**:
\`\`\`bash
npm install --legacy-peer-deps
# or
yarn install
\`\`\`

3. **Database Setup**:
\`\`\`bash
# Start XAMPP MySQL service
# Run the database setup script
mysql -u root -p < scripts/database-setup.sql
\`\`\`

4. **Environment Configuration**:
\`\`\`bash
# Create .env.local file
DATABASE_URL="mysql://root:password@localhost:3306/it_proctool_system"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
\`\`\`

5. **Start Development Server**:
\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

6. **Access Application**:
- Main Application: `http://localhost:3000`
- Admin Portal: `http://localhost:3000/admin/secure-portal`

---

## 📖 User Guides

### **For Students**:

1. **Accessing Exams**:
   - Visit the main page
   - Enter your Student ID
   - Click "Enter Exam Portal"

2. **Taking Proctored Exams**:
   - Click "Start Proctored Exam" on available exam
   - Read and accept proctoring rules
   - Allow fullscreen mode when prompted
   - Complete the embedded form
   - Avoid tab switching or minimizing window

3. **Understanding Violations**:
   - Red warning screens indicate violations
   - Wait for automatic unblocking (10 seconds)
   - Contact teacher if persistent issues occur

### **For Teachers**:

1. **Creating Exams**:
   - Login to teacher dashboard
   - Click "Create New Exam"
   - Fill in exam details and form URL
   - Set duration and schedule
   - Save and activate exam

2. **Monitoring Students**:
   - Use "Live Monitoring" tab during exams
   - Watch for violation alerts
   - Review student activity in real-time
   - Check "Violations Log" for detailed reports

3. **Managing Settings**:
   - Configure detection sensitivity
   - Set violation thresholds
   - Customize alert preferences
   - Save changes to apply globally

### **For Administrators**:

1. **User Management**:
   - Access admin portal via direct URL
   - Add/edit student and teacher accounts
   - Manage account statuses
   - Bulk operations for efficiency

2. **System Configuration**:
   - Configure global proctoring settings
   - Set security parameters
   - Monitor system performance
   - Review audit logs

---

## 🔌 API Documentation

### **Authentication Endpoints**:

\`\`\`javascript
// Student Login
POST /api/auth/student
Body: { studentId: string }
Response: { success: boolean, token: string }

// Teacher Login
POST /api/auth/teacher
Body: { email: string, password: string }
Response: { success: boolean, token: string, user: object }

// Admin Login
POST /api/auth/admin
Body: { email: string, password: string }
Response: { success: boolean, token: string, user: object }
\`\`\`

### **Exam Management Endpoints**:

\`\`\`javascript
// Get Student Exams
GET /api/exams/student/:studentId
Response: { exams: array }

// Create Exam (Teacher)
POST /api/exams/create
Body: { title, description, formUrl, duration, startTime, endTime }
Response: { success: boolean, examId: string }

// Get Exam Details
GET /api/exams/:examId
Response: { exam: object }
\`\`\`

### **Monitoring Endpoints**:

\`\`\`javascript
// Log Violation
POST /api/violations/log
Body: { sessionId, type, description, severity }
Response: { success: boolean, violationId: string }

// Get Violations
GET /api/violations/:sessionId
Response: { violations: array }

// Real-time Updates (WebSocket)
WS /api/monitoring/live
Events: violation, student-activity, exam-status
\`\`\`

---

## 🗄️ Database Schema

### **Core Tables**:

#### **students**
\`\`\`sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- student_id (VARCHAR(20), UNIQUE)
- name (VARCHAR(100))
- email (VARCHAR(100), UNIQUE)
- password_hash (VARCHAR(255))
- status (ENUM: active, suspended, inactive)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
\`\`\`

#### **teachers**
\`\`\`sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- name (VARCHAR(100))
- email (VARCHAR(100), UNIQUE)
- password_hash (VARCHAR(255))
- department (VARCHAR(100))
- status (ENUM: active, inactive)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
\`\`\`

#### **exams**
\`\`\`sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- title (VARCHAR(200))
- description (TEXT)
- teacher_id (INT, FOREIGN KEY)
- form_url (VARCHAR(500))
- duration_minutes (INT)
- start_time (DATETIME)
- end_time (DATETIME)
- proctored (BOOLEAN)
- status (ENUM: draft, active, completed, cancelled)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
\`\`\`

#### **exam_sessions**
\`\`\`sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- exam_id (INT, FOREIGN KEY)
- student_id (INT, FOREIGN KEY)
- session_token (VARCHAR(255), UNIQUE)
- start_time (TIMESTAMP)
- end_time (TIMESTAMP)
- status (ENUM: not_started, in_progress, completed, terminated)
- violations_count (INT)
- final_score (DECIMAL(5,2))
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
\`\`\`

#### **violations**
\`\`\`sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- session_id (INT, FOREIGN KEY)
- violation_type (ENUM: TAB_SWITCH, FULLSCREEN_EXIT, INACTIVITY, etc.)
- description (TEXT)
- severity (ENUM: low, medium, high)
- timestamp (TIMESTAMP)
- resolved (BOOLEAN)
- notes (TEXT)
\`\`\`

---

## 🔧 Troubleshooting

### **Common Issues**:

#### **Installation Problems**:
- **Node.js not recognized**: Restart terminal after Node.js installation
- **npm install fails**: Use `npm install --legacy-peer-deps`
- **Port 3000 in use**: Kill process or use different port

#### **Database Issues**:
- **Connection failed**: Check XAMPP MySQL service status
- **Tables not created**: Run database setup script manually
- **Permission denied**: Check MySQL user permissions

#### **Application Issues**:
- **Blank page**: Check browser console for errors
- **Login fails**: Verify credentials and database connection
- **Proctoring not working**: Check browser permissions and JavaScript

#### **Performance Issues**:
- **Slow loading**: Check internet connection and server resources
- **Memory leaks**: Restart development server
- **Database slow**: Optimize queries and add indexes

### **Debug Mode**:
\`\`\`bash
# Enable debug logging
DEBUG=* npm run dev

# Check application logs
tail -f logs/application.log

# Database query logging
SET GLOBAL general_log = 'ON';
\`\`\`

---

## 📞 Support & Contact

### **Technical Support**:
- **Documentation**: Check this file for detailed information
- **Issues**: Report bugs via GitHub issues
- **Updates**: Check for system updates regularly

### **Security Concerns**:
- **Vulnerabilities**: Report immediately to admin
- **Access Issues**: Contact system administrator
- **Data Breaches**: Follow incident response protocol

---

## 📄 License & Legal

### **Usage Rights**:
- Educational use permitted
- Commercial use requires license
- Modification allowed with attribution

### **Privacy Policy**:
- Student data protection compliance
- GDPR/CCPA adherence
- Data retention policies
- User consent management

### **Terms of Service**:
- Acceptable use policy
- Violation consequences
- Service availability
- Limitation of liability

---

## 🔄 Version History

### **v1.0.0** (Current)
- Initial release
- Core proctoring features
- Multi-role authentication
- Form integration support
- Real-time monitoring
- Violation detection system

### **Planned Features** (v1.1.0):
- AI-powered cheating detection
- Video recording capabilities
- Mobile app companion
- Advanced analytics
- Multi-language support
- API rate limiting
- Enhanced security features

---

*Last Updated: January 2024*
*System Version: 1.0.0*
*Documentation Version: 1.0*
