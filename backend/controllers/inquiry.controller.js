/**
 * Inquiry Controller
 * Handles: DB save · WhatsApp notification · Email notification
 */

'use strict';

const { validationResult } = require('express-validator');
const Inquiry              = require('../models/Inquiry');
const { sendWhatsApp }     = require('../services/whatsapp.service');
const { sendEmail }        = require('../services/email.service');

// ─────────────────────────────────────────────────────────────
//  POST /api/inquiry  –  Create & notify
// ─────────────────────────────────────────────────────────────
exports.createInquiry = async (req, res) => {
  // 1. Validate incoming request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please check your inputs.',
      errors : errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }

  const { name, email, service, message } = req.body;

  try {
    // 2. Save to MongoDB
    const inquiry = await Inquiry.create({
      name,
      email,
      service,
      message,
      ipAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
    });

    console.log(`\n📥  New inquiry saved  →  ID: ${inquiry._id}  |  ${name}  |  ${service}`);

    // 3. Fire WhatsApp + Email in parallel (non-blocking response)
    const [waResult, emailResult] = await Promise.allSettled([
      sendWhatsApp({ name, email, service, message, inquiryId: inquiry._id }),
      sendEmail({ name, email, service, message, inquiryId: inquiry._id }),
    ]);

    // 4. Update notification flags
    const updateFlags = {};
    if (waResult.status === 'fulfilled' && waResult.value?.success) {
      updateFlags.whatsappSent = true;
      console.log(`✅  WhatsApp sent  →  SID: ${waResult.value.sid}`);
    } else {
      console.error(`⚠️   WhatsApp failed:`, waResult.reason?.message || waResult.reason);
    }

    if (emailResult.status === 'fulfilled' && emailResult.value?.success) {
      updateFlags.emailSent = true;
      console.log(`✅  Emails sent    →  Owner + Customer`);
    } else {
      console.error(`⚠️   Email failed:`, emailResult.reason?.message || emailResult.reason);
    }

    if (Object.keys(updateFlags).length > 0) {
      await Inquiry.findByIdAndUpdate(inquiry._id, updateFlags);
    }

    // 5. Respond to client
    return res.status(201).json({
      success  : true,
      message  : '🎉 Inquiry submitted! We will reach out to you shortly.',
      inquiryId: inquiry._id,
    });

  } catch (err) {
    console.error('❌  createInquiry error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again or contact us via WhatsApp.',
    });
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/inquiry  –  List all (admin)
// ─────────────────────────────────────────────────────────────
exports.getAllInquiries = async (_req, res) => {
  try {
    const inquiries = await Inquiry
      .find()
      .sort({ createdAt: -1 })
      .select('-__v');

    return res.json({
      success: true,
      count  : inquiries.length,
      data   : inquiries,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/inquiry/stats
// ─────────────────────────────────────────────────────────────
exports.getStats = async (_req, res) => {
  try {
    const [total, byStatus, byService] = await Promise.all([
      Inquiry.countDocuments(),
      Inquiry.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Inquiry.aggregate([
        { $group: { _id: '$service', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return res.json({
      success: true,
      data   : { total, byStatus, byService },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

