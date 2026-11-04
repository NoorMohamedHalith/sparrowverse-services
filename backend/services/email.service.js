/**
 * Email Notification Service (Nodemailer + Gmail SMTP)
 * Sends two emails on each new inquiry:
 *   1. Owner notification  → contact.nrmdhalith@gmail.com
 *   2. Customer confirmation → customer's email
 *
 * Gmail Setup:
 *   Google Account → Security → 2-Step Verification → App Passwords
 *   Generate a 16-char App Password and set it as EMAIL_PASS in .env
 */

'use strict';

const nodemailer = require('nodemailer');

// ─── Transporter (singleton) ─────────────────────────────────
let _transporter = null;
let _isEthereal = false;

async function getTransporter() {
  if (!_transporter) {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && !process.env.EMAIL_USER.includes('your_gmail')) {
      _transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      _isEthereal = false;
    } else {
      console.log('📬 Configured custom Gmail not found, generating instant active Ethereal mail account...');
      const testAccount = await nodemailer.createTestAccount();
      _transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      _isEthereal = true;
      console.log(`✅ Instant Email Server Active! Test User: ${testAccount.user}`);
    }
  }
  return _transporter;
}

// ─── Helper: IST timestamp ────────────────────────────────────
function istTimestamp() {
  return new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday : 'long',
    day     : '2-digit',
    month   : 'long',
    year    : 'numeric',
    hour    : '2-digit',
    minute  : '2-digit',
    hour12  : true,
  });
}

// ─── BRAND COLORS (matches site theme) ───────────────────────
const CYAN   = '#00D2FF';
const PURPLE = '#9B51E0';
const BG     = '#0B0F19';
const BG2    = '#11172A';
const TEXT   = '#E8EEFF';
const MUTED  = '#7A85A8';

// ─────────────────────────────────────────────────────────────
//  Owner Notification Email
// ─────────────────────────────────────────────────────────────
function ownerEmailHtml({ name, email, service, message, inquiryId }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>New Inquiry – SparrowVerse</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:40px 16px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,${CYAN},${PURPLE});border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
            <div style="font-size:36px;margin-bottom:8px;">🪶</div>
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">
              SparrowVerse Services
            </h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">
              New Customer Inquiry Received!
            </p>
          </td>
        </tr>

        <!-- Alert Banner -->
        <tr>
          <td style="background:#0F1526;padding:20px 40px;border-left:1px solid rgba(255,255,255,0.08);border-right:1px solid rgba(255,255,255,0.08);">
            <div style="background:rgba(0,210,255,0.1);border:1px solid rgba(0,210,255,0.3);border-radius:10px;padding:14px 18px;display:flex;align-items:center;">
              <span style="font-size:20px;margin-right:12px;">🔔</span>
              <div>
                <strong style="color:${CYAN};font-size:14px;">New inquiry from a potential customer!</strong><br/>
                <span style="color:${MUTED};font-size:12px;">Received on ${istTimestamp()}</span>
              </div>
            </div>
          </td>
        </tr>

        <!-- Customer Details -->
        <tr>
          <td style="background:${BG2};padding:32px 40px;border-left:1px solid rgba(255,255,255,0.08);border-right:1px solid rgba(255,255,255,0.08);">
            <h2 style="margin:0 0 20px;color:${TEXT};font-size:16px;font-weight:700;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:12px;">
              📋 Customer Details
            </h2>

            <!-- Name -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
              <tr>
                <td width="120" style="color:${MUTED};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;padding-top:2px;">
                  👤 Name
                </td>
                <td style="color:${TEXT};font-size:15px;font-weight:600;">
                  ${name}
                </td>
              </tr>
            </table>

            <!-- Email -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
              <tr>
                <td width="120" style="color:${MUTED};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;padding-top:2px;">
                  📧 Email
                </td>
                <td>
                  <a href="mailto:${email}" style="color:${CYAN};font-size:15px;font-weight:600;text-decoration:none;">
                    ${email}
                  </a>
                </td>
              </tr>
            </table>

            <!-- Service -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td width="120" style="color:${MUTED};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;padding-top:2px;">
                  ⚙️ Service
                </td>
                <td>
                  <span style="background:rgba(155,81,224,0.2);border:1px solid rgba(155,81,224,0.4);border-radius:20px;padding:4px 14px;color:#C07BF5;font-size:13px;font-weight:600;">
                    ${service}
                  </span>
                </td>
              </tr>
            </table>

            <!-- Message -->
            <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:18px 20px;margin-bottom:24px;">
              <p style="margin:0 0 8px;color:${MUTED};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">
                💬 Message / Requirements
              </p>
              <p style="margin:0;color:${TEXT};font-size:14px;line-height:1.7;white-space:pre-wrap;">
                ${message}
              </p>
            </div>

            <!-- Inquiry ID -->
            <p style="margin:0;color:${MUTED};font-size:12px;">
              🆔 Inquiry ID: <code style="color:${CYAN};background:rgba(0,210,255,0.08);padding:2px 8px;border-radius:4px;">${inquiryId}</code>
            </p>
          </td>
        </tr>

        <!-- CTA Buttons -->
        <tr>
          <td style="background:${BG2};padding:0 40px 32px;border-left:1px solid rgba(255,255,255,0.08);border-right:1px solid rgba(255,255,255,0.08);">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-right:8px;" width="50%">
                  <a href="https://wa.me/${(process.env.OWNER_WHATSAPP||'').replace(/\D/g,'')}?text=Hi%20${encodeURIComponent(name)},%20thank%20you%20for%20your%20inquiry%20at%20SparrowVerse!"
                     style="display:block;background:linear-gradient(135deg,#25D366,#128C7E);color:#fff;text-align:center;padding:14px 20px;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none;">
                    📱 Reply on WhatsApp
                  </a>
                </td>
                <td align="center" style="padding-left:8px;" width="50%">
                  <a href="mailto:${email}?subject=Re: Your SparrowVerse Inquiry – ${encodeURIComponent(service)}"
                     style="display:block;background:linear-gradient(135deg,${CYAN},${PURPLE});color:#fff;text-align:center;padding:14px 20px;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none;">
                    ✉️ Reply via Email
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#080C18;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;border:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;color:${MUTED};font-size:12px;line-height:1.6;">
              © 2026 SparrowVerse Services · Powered by your backend ⚡<br/>
              This is an automated notification. Do not reply to this email directly.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────
//  Customer Confirmation Email
// ─────────────────────────────────────────────────────────────
function customerEmailHtml({ name, service, inquiryId }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>We got your inquiry – SparrowVerse</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:40px 16px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,${CYAN},${PURPLE});border-radius:16px 16px 0 0;padding:40px;text-align:center;">
            <div style="font-size:48px;margin-bottom:12px;">✅</div>
            <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;">
              Inquiry Received!
            </h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">
              Thank you for reaching out to SparrowVerse Services
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:${BG2};padding:36px 40px;border-left:1px solid rgba(255,255,255,0.08);border-right:1px solid rgba(255,255,255,0.08);">
            <p style="margin:0 0 16px;color:${TEXT};font-size:15px;line-height:1.7;">
              Hi <strong style="color:${CYAN};">${name}</strong> 👋
            </p>
            <p style="margin:0 0 16px;color:#9BA4BF;font-size:14px;line-height:1.75;">
              We've successfully received your inquiry for <strong style="color:${TEXT};">${service}</strong>.
              Our team will review your requirements and get back to you <strong style="color:${TEXT};">within a few hours</strong>.
            </p>
            <p style="margin:0 0 24px;color:#9BA4BF;font-size:14px;line-height:1.75;">
              For the fastest response, feel free to reach us directly on WhatsApp:
            </p>

            <!-- WhatsApp CTA -->
            <div style="text-align:center;margin-bottom:28px;">
              <a href="https://wa.me/919361860781?text=Hi%20SparrowVerse%20team!%20I%20just%20submitted%20an%20inquiry%20(ID:%20${inquiryId})%20for%20${encodeURIComponent(service)}."
                 style="display:inline-block;background:linear-gradient(135deg,#25D366,#128C7E);color:#fff;padding:16px 32px;border-radius:12px;font-size:15px;font-weight:700;text-decoration:none;">
                💬 Chat with us on WhatsApp
              </a>
            </div>

            <!-- Inquiry Details Box -->
            <div style="background:rgba(0,210,255,0.06);border:1px solid rgba(0,210,255,0.2);border-radius:12px;padding:20px 24px;margin-bottom:24px;">
              <p style="margin:0 0 12px;color:${CYAN};font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">
                📋 Your Inquiry Summary
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color:${MUTED};font-size:12px;padding-bottom:8px;width:120px;">Service</td>
                  <td style="color:${TEXT};font-size:13px;font-weight:600;padding-bottom:8px;">${service}</td>
                </tr>
                <tr>
                  <td style="color:${MUTED};font-size:12px;padding-bottom:8px;">Inquiry ID</td>
                  <td style="color:${CYAN};font-size:13px;font-weight:600;padding-bottom:8px;">${inquiryId}</td>
                </tr>
                <tr>
                  <td style="color:${MUTED};font-size:12px;">Submitted</td>
                  <td style="color:${TEXT};font-size:13px;font-weight:600;">${istTimestamp()}</td>
                </tr>
              </table>
            </div>

            <p style="margin:0;color:#9BA4BF;font-size:13px;line-height:1.7;">
              🌟 We're committed to delivering <strong style="color:${TEXT};">100% quality</strong>,
              <strong style="color:${TEXT};">on time</strong>, every time.
              We look forward to working with you!
            </p>
          </td>
        </tr>

        <!-- Contact Bar -->
        <tr>
          <td style="background:#080C18;padding:20px 40px;border-left:1px solid rgba(255,255,255,0.06);border-right:1px solid rgba(255,255,255,0.06);">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="color:${MUTED};font-size:12px;text-align:center;">
                  📱 <a href="https://wa.me/919361860781" style="color:${CYAN};text-decoration:none;">+91 93618 60781</a>
                  &nbsp;·&nbsp;
                  ✉️ <a href="mailto:contact.nrmdhalith@gmail.com" style="color:${CYAN};text-decoration:none;">contact.nrmdhalith@gmail.com</a>
                  &nbsp;·&nbsp;
                  📸 <a href="https://www.instagram.com/sparrowverse.digital_studio" style="color:${CYAN};text-decoration:none;">@sparrowverse.digital_studio</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#060810;border-radius:0 0 16px 16px;padding:16px 40px;text-align:center;border:1px solid rgba(255,255,255,0.05);">
            <p style="margin:0;color:#3A4060;font-size:11px;">
              © 2026 SparrowVerse Services · Your Vision • Our Creation<br/>
              You received this because you submitted an inquiry on our website.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────
//  sendEmail – exported function
// ─────────────────────────────────────────────────────────────
/**
 * @param {Object} payload  { name, email, service, message, inquiryId }
 * @returns {Promise<{ success: boolean }>}
 */
exports.sendEmail = async ({ name, email, service, message, inquiryId }) => {
  const transporter = await getTransporter();
  const ownerEmail  = process.env.OWNER_EMAIL || 'contact.nrmdhalith@gmail.com';
  const ownerName   = process.env.OWNER_NAME  || 'Noor Mohamed Halith';
  const senderEmail = _isEthereal ? transporter.options.auth.user : process.env.EMAIL_USER;

  // 1️⃣  Notify owner
  const infoOwner = await transporter.sendMail({
    from   : `"SparrowVerse Bot 🤖" <${senderEmail}>`,
    to     : `"${ownerName}" <${ownerEmail}>`,
    subject: `🌟 New Inquiry – ${service} | From ${name}`,
    html   : ownerEmailHtml({ name, email, service, message, inquiryId }),
  });

  // 2️⃣  Confirm to customer
  const infoCustomer = await transporter.sendMail({
    from   : `"SparrowVerse Services 🪶" <${senderEmail}>`,
    to     : `"${name}" <${email}>`,
    subject: `✅ We received your inquiry – SparrowVerse Services`,
    html   : customerEmailHtml({ name, service, inquiryId }),
  });

  if (_isEthereal) {
    console.log('🔗 Preview Owner Notification Email:', nodemailer.getTestMessageUrl(infoOwner));
    console.log('🔗 Preview Customer Confirmation Email:', nodemailer.getTestMessageUrl(infoCustomer));
  }

  return { success: true };
};

