// models/Application.js

const mongoose = require("mongoose");

// Define a schema for applicant's personal information
const personalInfoSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "First name is required"],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, "Last name is required"],
    trim: true,
  },
  middleName: {
    type: String,
    trim: true,
  },
  dateOfBirth: {
    type: Date,
    required: [true, "Date of birth is required"],
  },
});

// Define a schema for contact information
const contactInfoSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      "Please enter a valid email address",
    ],
  },
  phoneNumber: {
    type: String,
    required: [true, "Phone number is required"],
    trim: true,
    match: [
      /^(?:\+1\s?)?(?:\([2-9]\d{2}\)|[2-9]\d{2})[\s.-]?\d{3}[\s.-]?\d{4}$/,
      "Please enter a valid US phone number",
    ],
  },
});

// Define a schema for address information
const addressSchema = new mongoose.Schema({
  street: {
    type: String,
    required: [true, "Street address is required"],
    trim: true,
  },
  city: {
    type: String,
    required: [true, "City is required"],
    trim: true,
  },
  state: {
    type: String,
    required: [true, "State is required"],
    trim: true,
    enum: [
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
    ],
  },
  zipCode: {
    type: String,
    required: [true, "ZIP code is required"],
    trim: true,
    match: [/^\d{5}(-\d{4})?$/, "Please enter a valid ZIP code"],
  },
});

// Define the main Application schema
const applicationSchema = new mongoose.Schema(
  {
    personalInfo: {
      type: personalInfoSchema,
      required: true,
    },
    contactInfo: {
      type: contactInfoSchema,
      required: true,
    },
    address: {
      type: addressSchema,
      required: true,
    },
    coverLetter: {
      type: String,
      trim: true,
    },
    resumePath: {
      type: String,
      required: [true, "Resume is required"],
    },
    resumeOriginalName: {
      type: String,
    },
    applicationStatus: {
      type: String,
      enum: ["pending", "reviewed", "interviewed", "rejected", "hired"],
      default: "pending",
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    notes: [
      {
        content: String,
        addedBy: String,
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to update lastUpdated field
applicationSchema.pre("save", function (next) {
  this.lastUpdated = Date.now();
  next();
});

// Create and export the Application model
const Application = mongoose.model("Application", applicationSchema);

module.exports = Application;
