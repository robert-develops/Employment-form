// server.js - Main Express application file

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const { body, validationResult } = require("express-validator");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static("public")); // Serve static files

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedFileTypes = [".pdf", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedFileTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only .pdf, .doc, and .docx files are allowed"));
    }
  },
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/EmploymentList", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define the Job Application Schema
const applicationSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  middleName: { type: String },
  dateOfBirth: { type: Date, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  coverLetter: { type: String },
  resumePath: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
});

// Create the model
const Application = mongoose.model("Application", applicationSchema);

// Form validation middleware
const validateApplication = [
  body("firstName").notEmpty().withMessage("First name is required"),
  body("lastName").notEmpty().withMessage("Last name is required"),
  body("dateOfBirth").notEmpty().withMessage("Date of birth is required"),
  body("email").isEmail().withMessage("Valid email address is required"),
  body("phoneNumber")
    .matches(
      /^(?:\+1\s?)?(?:\([2-9]\d{2}\)|[2-9]\d{2})[\s.-]?\d{3}[\s.-]?\d{4}$/
    )
    .withMessage("Valid US phone number is required"),
  body("address").notEmpty().withMessage("Address is required"),
  body("city").notEmpty().withMessage("City is required"),
  body("state").notEmpty().withMessage("State is required"),
  body("zipCode").notEmpty().withMessage("ZIP code is required"),
];

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Handle application submission
app.post(
  "/api/applications",
  upload.single("resume"),
  validateApplication,
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ error: "Resume file is required" });
      }

      // Create new application
      const application = new Application({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        middleName: req.body.middleName,
        dateOfBirth: new Date(req.body.dateOfBirth),
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        zipCode: req.body.zipCode,
        coverLetter: req.body.coverLetter,
        resumePath: req.file.path,
      });

      // Save to database
      await application.save();

      res.status(201).json({
        success: true,
        message: "Application submitted successfully",
        applicationId: application._id,
      });
    } catch (error) {
      console.error("Error submitting application:", error);
      res.status(500).json({
        success: false,
        message: "Server error while submitting application",
      });
    }
  }
);

// Ensure uploads directory exists
const fs = require("fs");
if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads");
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
