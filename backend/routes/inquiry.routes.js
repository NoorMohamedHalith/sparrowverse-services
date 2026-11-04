/**
 * Inquiry Routes
 */

'use strict';

const express   = require('express');
const router    = express.Router();
const rateLimit = require('express-rate-limit');
const { body }  = require('express-validator');

const inquiryController = require('../controllers/inquiry.controller');

// ─── Strict Rate Limit for form submissions ───────────────────
const submitLimiter = rateLimit({
  windowMs       : 60 * 60 * 1000,  // 1 hour window
  max            : 5,                // max 5 submissions per IP per hour
  standardHeaders: true,
  legacyHeaders  : false,
  message        : {
    success: false,
    message: 'Too many submissions from this IP. Please try again after 1 hour.',
  },
});

// ─── Validation Rules ─────────────────────────────────────────
const inquiryValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters')
    .escape(),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),

  body('service')
    .trim()
    .notEmpty().withMessage('Please select a service')
    .isIn([
      'Conference Paper Writing & Assistance',
      'Project Report Preparation',
      'PPT Presentation Making',
      'ATS Resume Creation',
      'Poster Design',
      'Assignment Works',
      'Video Editing',
      'Portfolio Website Development',
      'Other / Custom Requirement',
    ]).withMessage('Invalid service selection'),

  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ min: 10, max: 2000 }).withMessage('Message must be 10–2000 characters')
    .escape(),
];

// ─── Routes ───────────────────────────────────────────────────

// POST /api/inquiry – Submit new inquiry
router.post('/', submitLimiter, inquiryValidation, inquiryController.createInquiry);

// GET  /api/inquiry – Fetch all inquiries (admin use)
router.get('/', inquiryController.getAllInquiries);

// GET  /api/inquiry/stats – Quick stats
router.get('/stats', inquiryController.getStats);

module.exports = router;

