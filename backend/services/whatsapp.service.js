/**
 * WhatsApp Notification Service (Twilio WhatsApp API)
 * Sends a formatted WhatsApp message to the owner whenever
 * a new customer inquiry is submitted.
 *
 * Setup:
 *   1. Create Twilio account → https://console.twilio.com
 *   2. Enable WhatsApp Sandbox → Messaging → Try it out → Send a WhatsApp message
 *   3. Owner joins sandbox: send "join <sandbox-keyword>" to +1 415 523 8886
 *   4. Fill TWILIO_* vars in .env
 */

'use strict';

const twilio = require('twilio');

// Lazy-init client so missing env vars don't crash on import
let _client = null;
function getClient() {
  if (!_client) {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials missing in .env (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)');
    }
    _client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return _client;
}

/**
 * Build a human-friendly IST timestamp string
 */
function istTimestamp() {
  return new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day     : '2-digit',
    month   : 'short',
    year    : 'numeric',
    hour    : '2-digit',
    minute  : '2-digit',
    hour12  : true,
  });
}

/**
 * sendWhatsApp – notify the SparrowVerse owner
 * @param {Object} payload  { name, email, service, message, inquiryId }
 * @returns {Promise<{ success: boolean, sid?: string }>}
 */
exports.sendWhatsApp = async ({ name, email, service, message, inquiryId }) => {
  const ownerWA    = process.env.OWNER_WHATSAPP;    // +919361860781
  const twilioFrom = process.env.TWILIO_WHATSAPP_FROM; // +14155238886

  // ── Message body ──
  const body =
    `🌟 *New SparrowVerse Customer!*\n\n` +
    `👤 *Name:*     ${name}\n` +
    `📧 *Email:*    ${email}\n` +
    `⚙️ *Service:*  ${service}\n\n` +
    `💬 *Message:*\n${message}\n\n` +
    `─────────────────────\n` +
    `🆔 *Inquiry ID:* ${inquiryId}\n` +
    `🕐 *Time (IST):* ${istTimestamp()}\n` +
    `─────────────────────\n` +
    `Reply directly to this customer or open your dashboard 🚀`;

  // Check if real Twilio keys are provided
  if (
    process.env.TWILIO_ACCOUNT_SID &&
    !process.env.TWILIO_ACCOUNT_SID.includes('ACxxxx') &&
    process.env.TWILIO_AUTH_TOKEN &&
    !process.env.TWILIO_AUTH_TOKEN.includes('xxxx')
  ) {
    const result = await getClient().messages.create({
      from: `whatsapp:+${twilioFrom.replace(/\D/g, '')}`,
      to  : `whatsapp:+${ownerWA.replace(/\D/g, '')}`,
      body,
    });
    return { success: true, sid: result.sid };
  } else {
    // Development/Local auto-mock delivery
    console.log('\n📲 [WHATSAPP DISPATCHED TO OWNER +91 9361860781]');
    console.log('--------------------------------------------------');
    console.log(body);
    console.log('--------------------------------------------------');
    return { success: true, sid: `mock_wa_${Date.now()}` };
  }
};

