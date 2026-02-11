# CodeStream IDE

A powerful, full-featured online code editor and development environment that supports multiple programming languages with real-time code execution, frontend playground, and collaborative features.

![CodeStream IDE](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node.js](https://img.shields.io/badge/node-18.x-green.svg)
![License](https://img.shields.io/badge/license-ISC-yellow.svg)

## 🚀 Features

### Multi-Language Code Editor
- **Supported Languages**: C, C++, Java, Python, JavaScript
- **Real-time Code Execution**: Run code directly in the browser with instant output
- **Syntax Highlighting**: Monaco Editor integration for professional code editing
- **Terminal Integration**: Built-in WebSocket-based terminal for interactive command execution

### Frontend Playground
- **Multi-file Support**: Create and manage HTML, CSS, and JavaScript files
- **Live Preview**: Real-time preview of your web applications
- **Asset Management**: Upload and manage images and other assets
- **Project Persistence**: Save and load frontend projects

### User Management
- **Secure Authentication**: JWT-based authentication system
- **Google OAuth**: Sign in with Google for quick access
- **OTP Verification**: Email-based OTP verification for registration
- **Password Reset**: Secure password recovery system
- **User Profiles**: Personalized user experience

### Code Management
- **Save Code**: Save your code snippets with authentication
- **Share Code**: Generate shareable links for your code
- **Code History**: Access previously saved code
- **Project Organization**: Organize code by language and project

### Support System
- **Contact Form**: Submit support tickets
- **Admin Dashboard**: Manage and track support tickets
- **Email Notifications**: Automated email notifications for ticket updates
- **Ticket Status Tracking**: Track ticket status (open, in-progress, resolved)

## 🛠️ Tech Stack

### Backend
- **Node.js** (v18.x) - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - Database for user data and code storage
- **JWT** - Authentication and authorization
- **Nodemailer** - Email service integration
- **Compilex** - Code compilation and execution
- **WebSocket (ws)** - Real-time terminal communication

### Frontend
- **HTML5/CSS3** - Modern web standards
- **JavaScript (ES6+)** - Client-side scripting
- **Monaco Editor** - Code editor component
- **Xterm.js** - Terminal emulator

### Authentication & Email
- **Google OAuth 2.0** - Social authentication
- **Gmail API** - Email sending service
- **Brevo API** - Alternative email service
- **Resend API** - Backup email service
- **bcrypt** - Password hashing

### DevOps
- **Docker** - Containerization
- **Render** - Cloud deployment platform
- **Git** - Version control

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18.x or higher)
- **npm** (comes with Node.js)
- **MongoDB** (local or cloud instance)
- **Git** (for version control)

For code execution features, install:
- **Python 3** (for Python code execution)
- **GCC/G++** (for C/C++ compilation)
- **Java JDK** (for Java compilation and execution)

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Memory\ Update
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database
MONGODB_URI=your_mongodb_connection_string
DB_NAME=codeEditorDB

# Server
PORT=3000
NODE_ENV=development

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URL=http://localhost:3000/auth/google/callback
GOOGLE_REFRESH_TOKEN=your_refresh_token

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure_admin_password

# Optional Email Services
BREVO_API_KEY=your_brevo_api_key
RESEND_API_KEY=your_resend_api_key
```

### 4. Database Setup

Ensure your MongoDB instance is running and accessible. The application will automatically create the necessary collections:
- `users` - User accounts and authentication
- `otps` - OTP verification codes
- `contactSubmissions` - Support tickets
- `codes` - Saved code snippets
- `sharedCodes` - Shared code links

### 5. Start the Application

**Development Mode:**
```bash
npm start
```

**Production Mode:**
```bash
NODE_ENV=production node Api.js
```

The server will start at `http://localhost:3000`

## 🐳 Docker Deployment

### Build Docker Image
```bash
docker build -t codestream-ide .
```

### Run Docker Container
```bash
docker run -p 3000:3000 --env-file .env codestream-ide
```

## ☁️ Render Deployment

This project is configured for deployment on Render using Docker.

### Deployment Steps:

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Deploy to Render"
   git push origin main
   ```

2. **Connect to Render:**
   - Create a new Web Service on [Render](https://render.com)
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` configuration

3. **Configure Environment Variables:**
   Set all required environment variables in the Render dashboard:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `EMAIL_USER`
   - `EMAIL_PASS`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URL` (update with your Render URL)
   - `GOOGLE_REFRESH_TOKEN`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`

4. **Deploy:**
   Render will automatically build and deploy your application.

### Update Google OAuth Redirect URL:
After deployment, update your Google OAuth credentials:
- Redirect URL: `https://your-app-name.onrender.com/auth/google/callback`

## 📖 Usage

### Code Editor
1. Navigate to `/editor` or `/frontend-editor`
2. Select your programming language
3. Write your code in the editor
4. Click "Run" to execute
5. View output in the console/preview panel

### User Registration
1. Go to `/register`
2. Enter your email
3. Receive OTP via email
4. Verify OTP and set passwords
5. Login with your credentials

### Google Sign-In
1. Click "Sign in with Google" on login page
2. Authorize the application
3. Automatically logged in

### Save & Share Code
1. Write code in the editor
2. Click "Save" (requires authentication)
3. Use "Share" to generate a shareable link
4. Access shared code via the generated URL

### Support Tickets
1. Navigate to `/contact`
2. Fill out the contact form
3. Receive ticket ID via email
4. Track ticket status through email updates

### Admin Dashboard
1. Login with admin credentials
2. Navigate to `/admin`
3. View and manage support tickets
4. Update ticket status

## 🔐 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication (7-day expiry)
- **Rate Limiting**: Protection against brute force attacks
  - OTP requests: 3 per 15 minutes
  - Password reset: 3 per hour
- **Input Validation**: Email format and password strength validation
- **CORS Protection**: Cross-origin resource sharing configuration
- **Environment Variables**: Sensitive data stored securely

## 📁 Project Structure

```
Memory Update/
├── Api.js                 # Main server file
├── db.js                  # Database connection
├── package.json           # Dependencies
├── Dockerfile            # Docker configuration
├── render.yaml           # Render deployment config
├── .env                  # Environment variables
├── .gitignore           # Git ignore rules
├── public/              # Frontend files
│   ├── landing.html     # Landing page
│   ├── code.html        # Code editor
│   ├── frontend-editor.html  # Frontend playground
│   ├── login.html       # Login page
│   ├── register.html    # Registration page
│   ├── contact.html     # Contact form
│   ├── admin-tickets.html    # Admin dashboard
│   ├── css/            # Stylesheets
│   ├── js/             # JavaScript files
│   └── images/         # Static images
├── frontend_projects/   # Saved frontend projects
├── frontend_assets/     # Uploaded assets
├── saved_codes/         # Saved code snippets
├── shared_codes/        # Shared code files
└── temp/               # Temporary compilation files
```

## 🌐 API Endpoints

### Authentication
- `POST /send-otp` - Send OTP for registration
- `POST /verify-otp` - Verify OTP and complete registration
- `POST /login` - User login
- `GET /verify-token` - Verify JWT token
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - Google OAuth callback

### Code Management
- `POST /compile` - Compile and execute code
- `POST /save-code` - Save code snippet
- `GET /get-saved-codes` - Retrieve saved codes
- `POST /share-code` - Generate shareable code link
- `GET /shared/:shareId` - Access shared code

### Frontend Playground
- `POST /save-frontend-project` - Save frontend project
- `GET /load-frontend-project/:projectId` - Load project
- `POST /upload-asset` - Upload asset file
- `GET /preview/:projectId` - Preview frontend project

### Support System
- `POST /api/contact` - Submit support ticket
- `GET /api/admin/tickets` - Get all tickets (admin)
- `PUT /api/admin/tickets/:id` - Update ticket status (admin)

### Utility
- `GET /check-compilers` - Check installed compilers
- `GET /test-email` - Test email configuration
- `WS /terminal` - WebSocket terminal connection

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👥 Authors

- **CodeStream IDE Team**

## 🐛 Known Issues & Troubleshooting

### Email Not Sending
- Verify `EMAIL_SERVICE` is set correctly (gmail/brevo/resend)
- Check Gmail App Password is valid
- Ensure `GOOGLE_REFRESH_TOKEN` is configured for Gmail API

### Code Compilation Errors
- Verify compilers are installed: `GET /check-compilers`
- Check file permissions in temp directories
- Ensure Docker has necessary build tools

### Google OAuth Issues
- Verify redirect URL matches Google Console settings
- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Ensure OAuth consent screen is configured

### Database Connection
- Verify MongoDB URI is correct
- Check network access in MongoDB Atlas
- Ensure database user has proper permissions

## 📞 Support

For support, email codeeditor02@gmail.com or create a ticket through the contact form.

## 🔗 Links

- **Live Demo**: [https://memory-update.onrender.com](https://memory-update.onrender.com)
- **Documentation**: See this README
- **Issues**: Submit via contact form or GitHub issues

---

**Made with ❤️ by the CodeStream IDE Team**
