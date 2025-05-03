# JobFlow - Job Application Form Backend

This project is a complete backend solution for the JobFlow application form. It's built with Express.js, MongoDB, and includes file upload functionality, validation, and a complete API for managing job applications.

## Features

- Express.js API backend
- MongoDB integration with Mongoose
- File upload handling with Multer
- Form validation
- Error handling
- API endpoints for admin operations
- Ready for deployment

## Project Structure

```
jobflow-backend/
├── controllers/
│   └── applicationController.js
├── middleware/
│   └── errorHandler.js
├── models/
│   └── Application.js
├── public/
│   └── index.html
├── routes/
│   └── applicationRoutes.js
├── uploads/
├── .env
├── .gitignore
├── package.json
├── README.md
└── server.js
```

## Prerequisites

- Node.js (v14 or later)
- MongoDB (local installation or MongoDB Atlas account)
- NPM or Yarn

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd jobflow-backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on the provided template:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/jobflow
   NODE_ENV=development
   ```

4. Create necessary directories:
   ```
   mkdir -p public uploads
   ```

5. Place the HTML form in the `public` directory as `index.html`

## Running Locally

1. Start MongoDB (if using local installation):
   ```
   mongod
   ```

2. Start the server:
   ```
   npm run dev
   ```

3. Access the application at: http://localhost:3000

## API Endpoints

### Public Endpoints

- `POST /api/applications` - Submit a new job application

### Admin Endpoints (to be protected with authentication)

- `GET /api/applications` - Get all applications
- `GET /api/applications/:id` - Get a specific application by ID
- `PUT /api/applications/:id/status` - Update application status
- `DELETE /api/applications/:id` - Delete an application
- `GET /api/applications/:id/resume` - Download resume file

## Deployment to Production

### 1. Prepare for Deployment

Update the following in your `.env` file for production:

```
NODE_ENV=production
PORT=8080 (or the port provided by your hosting platform)
MONGODB_URI=<your-mongodb-atlas-connection-string>
```

### 2. Choose a Deployment Platform

#### Option 1: Deploying to Heroku

1. Install Heroku CLI and login:
   ```
   npm install -g heroku
   heroku login
   ```

2. Create a new Heroku app:
   ```
   heroku create jobflow-app
   ```

3. Add MongoDB add-on or configure environment variable with MongoDB Atlas:
   ```
   heroku config:set MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/jobflow
   ```

4. Deploy the app:
   ```
   git push heroku main
   ```

#### Option 2: Deploying to AWS EC2

1. Launch an EC2 instance and SSH into it.

2. Install Node.js, NPM, and MongoDB:
   ```
   sudo apt update
   sudo apt install nodejs npm mongodb
   sudo systemctl start mongodb
   ```

3. Clone your repository and install dependencies:
   ```
   git clone <repository-url>
   cd jobflow-backend
   npm install
   ```

4. Set up environment variables or create `.env` file.

5. Install PM2 for process management:
   ```
   npm install -g pm2
   pm2 start server.js
   pm2 startup
   ```

#### Option 3: Deploying with Docker

1. Create a `Dockerfile` in the project root:
   ```Dockerfile
   FROM node:16
   
   WORKDIR /usr/src/app
   
   COPY package*.json ./
   
   RUN npm install
   
   COPY . .
   
   EXPOSE 8080
   
   CMD ["node", "server.js"]
   ```

2. Create a `docker-compose.yml` file:
   ```yaml
   version: '3'
   services:
     app:
       build: .
       ports:
         - "8080:8080"
       environment:
         - NODE_ENV=production
         - MONGODB_URI=mongodb://mongo:27017/jobflow
       depends_on:
         - mongo
       volumes:
         - ./uploads:/usr/src/app/uploads
     
     mongo:
       image: mongo
       ports:
         - "27017:27017"
       volumes:
         - mongodb_data:/data/db
   
   volumes:
     mongodb_data:
   ```

3. Build and run with Docker Compose:
   ```
   docker-compose up -d
   ```

### Additional Steps for Production

1. Set up proper error logging with a service like Sentry or Loggly
2. Implement rate limiting to prevent abuse
3. Set up proper authentication for admin endpoints
4. Configure HTTPS
5. Set up a CI/CD pipeline for automated deployments

## Security Considerations

- Implement authentication and authorization for admin endpoints
- Set up CORS properly for production
- Validate and sanitize all incoming data
- Use HTTPS in production
- Limit file upload size and types
- Store sensitive information in environment variables

## License

MIT

## Support

For any questions or issues, please open an issue on the GitHub repository.