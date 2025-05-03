// controllers/applicationController.js

const Application = require("../models/Application");
const { validationResult } = require("express-validator");
const fs = require("fs");
const path = require("path");

// Submit a new job application
exports.submitApplication = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Check if resume file was uploaded
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "Resume file is required" });
    }

    // Create a new application
    const application = new Application({
      personalInfo: {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        middleName: req.body.middleName || "",
        dateOfBirth: new Date(req.body.dateOfBirth),
      },
      contactInfo: {
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
      },
      address: {
        street: req.body.address,
        city: req.body.city,
        state: req.body.state,
        zipCode: req.body.zipCode,
      },
      coverLetter: req.body.coverLetter || "",
      resumePath: req.file.path,
      resumeOriginalName: req.file.originalname,
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
};

// Get all applications (admin only)
exports.getAllApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .select("-resumePath") // Exclude resume file path for security
      .sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching applications",
    });
  }
};

// Get a single application by ID (admin only)
exports.getApplicationById = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error("Error fetching application:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching application",
    });
  }
};

// Update application status (admin only)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status, note } = req.body;

    if (
      !["pending", "reviewed", "interviewed", "rejected", "hired"].includes(
        status
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid application status",
      });
    }

    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    application.applicationStatus = status;

    // Add note if provided
    if (note) {
      application.notes.push({
        content: note,
        addedBy: "Admin", // Replace with actual admin user when auth is implemented
      });
    }

    await application.save();

    res.status(200).json({
      success: true,
      message: "Application status updated successfully",
      data: application,
    });
  } catch (error) {
    console.error("Error updating application status:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating application status",
    });
  }
};

// Delete an application (admin only)
exports.deleteApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Delete resume file
    if (application.resumePath) {
      try {
        fs.unlinkSync(application.resumePath);
      } catch (err) {
        console.error("Error deleting resume file:", err);
        // Continue with deletion even if file removal fails
      }
    }

    await Application.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting application:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting application",
    });
  }
};

// Download resume (admin only)
exports.downloadResume = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application || !application.resumePath) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    const resumePath = path.resolve(application.resumePath);

    // Check if file exists
    if (!fs.existsSync(resumePath)) {
      return res.status(404).json({
        success: false,
        message: "Resume file not found on server",
      });
    }

    // Set filename for download
    const filename = application.resumeOriginalName || "resume.pdf";

    res.download(resumePath, filename);
  } catch (error) {
    console.error("Error downloading resume:", error);
    res.status(500).json({
      success: false,
      message: "Server error while downloading resume",
    });
  }
};

// routes/applicationRoutes.js

const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const applicationController = require("./applicationController.js");
const multer = require("multer");
const path = require("path");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`);
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
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Form validation middleware
const validateApplication = [
  body("firstName").notEmpty().withMessage("First name is required").trim(),
  body("lastName").notEmpty().withMessage("Last name is required").trim(),
  body("dateOfBirth").notEmpty().withMessage("Date of birth is required"),
  body("email")
    .isEmail()
    .withMessage("Valid email address is required")
    .normalizeEmail(),
  body("phoneNumber")
    .matches(
      /^(?:\+1\s?)?(?:\([2-9]\d{2}\)|[2-9]\d{2})[\s.-]?\d{3}[\s.-]?\d{4}$/
    )
    .withMessage("Valid US phone number is required"),
  body("address").notEmpty().withMessage("Address is required").trim(),
  body("city").notEmpty().withMessage("City is required").trim(),
  body("state")
    .notEmpty()
    .withMessage("State is required")
    .isIn([
      "AL",
      "AK",
      "AZ",
      "AR",
      "CA",
      "CO",
      "CT",
      "DE",
      "FL",
      "GA",
      "HI",
      "ID",
      "IL",
      "IN",
      "IA",
      "KS",
      "KY",
      "LA",
      "ME",
      "MD",
      "MA",
      "MI",
      "MN",
      "MS",
      "MO",
      "MT",
      "NE",
      "NV",
      "NH",
      "NJ",
      "NM",
      "NY",
      "NC",
      "ND",
      "OH",
      "OK",
      "OR",
      "PA",
      "RI",
      "SC",
      "SD",
      "TN",
      "TX",
      "UT",
      "VT",
      "VA",
      "WA",
      "WV",
      "WI",
      "WY",
    ])
    .withMessage("Invalid state"),
  body("zipCode")
    .notEmpty()
    .withMessage("ZIP code is required")
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage("Invalid ZIP code format"),
];

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size exceeds the 5MB limit",
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  next();
};

// Routes
router.post(
  "/",
  upload.single("resume"),
  handleMulterError,
  validateApplication,
  applicationController.submitApplication
);

// Admin routes (consider adding authentication middleware)
router.get("/", applicationController.getAllApplications);
router.get("/:id", applicationController.getApplicationById);
router.put("/:id/status", applicationController.updateApplicationStatus);
router.delete("/:id", applicationController.deleteApplication);
router.get("/:id/resume", applicationController.downloadResume);

module.exports = router;

// middleware/errorHandler.js

// Global error handler
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

module.exports = errorHandler;

// server.js - Main application file

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const fs = require("fs");
const errorHandler = require("./middleware/errorHandler");
const applicationRoutes = require("./routes/applicationRoutes");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static("public")); // Serve static files

// Create uploads directory if it doesn't exist
if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads");
}

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/jobflow", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit process with failure
  });

// Routes
app.use("/api/applications", applicationRoutes);

// Serve the main HTML file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Error handler middleware
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // For testing purposes
