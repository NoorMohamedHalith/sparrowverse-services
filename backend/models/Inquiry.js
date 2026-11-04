/**
 * Inquiry Model – MongoDB Schema (Mongoose)
 * Stores every customer inquiry submitted via the SparrowVerse website.
 */

'use strict';

const mongoose = require('mongoose');

const SERVICES = [
  'Conference Paper Writing & Assistance',
  'Project Report Preparation',
  'PPT Presentation Making',
  'ATS Resume Creation',
  'Poster Design',
  'Assignment Works',
  'Video Editing',
  'Portfolio Website Development',
  'Other / Custom Requirement',
];

const inquirySchema = new mongoose.Schema(
  {
    // ── Customer Info ───────────────────────────────────────
    name: {
      type     : String,
      required : [true, 'Customer name is required'],
      trim     : true,
      minlength: [2,   'Name must be at least 2 characters'],
      maxlength: [100, 'Name must not exceed 100 characters'],
    },
    email: {
      type     : String,
      required : [true, 'Email is required'],
      trim     : true,
      lowercase: true,
      match    : [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
    },

    // ── Service & Message ───────────────────────────────────
    service: {
      type    : String,
      required: [true, 'Service selection is required'],
      enum    : { values: SERVICES, message: 'Invalid service: {VALUE}' },
    },
    message: {
      type     : String,
      required : [true, 'Message / requirements is required'],
      trim     : true,
      minlength: [10,   'Message must be at least 10 characters'],
      maxlength: [2000, 'Message must not exceed 2000 characters'],
    },

    // ── Status / Workflow ───────────────────────────────────
    status: {
      type   : String,
      enum   : ['new', 'contacted', 'in-progress', 'completed', 'cancelled'],
      default: 'new',
    },
    notes: {
      type   : String,
      default: '',
      trim   : true,
    },

    // ── Notification Flags ──────────────────────────────────
    whatsappSent: { type: Boolean, default: false },
    emailSent   : { type: Boolean, default: false },

    // ── Meta ────────────────────────────────────────────────
    ipAddress  : { type: String, default: '' },
    userAgent  : { type: String, default: '' },
  },
  {
    timestamps: true,          // adds createdAt & updatedAt
    versionKey: false,
  }
);

// ─── Indexes ─────────────────────────────────────────────────
inquirySchema.index({ email: 1 });
inquirySchema.index({ status: 1 });
inquirySchema.index({ createdAt: -1 });

// ─── Virtual: formatted date ──────────────────────────────────
inquirySchema.virtual('submittedAt').get(function () {
  return this.createdAt.toLocaleString('en-IN', {
    timeZone    : 'Asia/Kolkata',
    day         : '2-digit',
    month       : 'short',
    year        : 'numeric',
    hour        : '2-digit',
    minute      : '2-digit',
  });
});

module.exports = mongoose.model('Inquiry', inquirySchema);

