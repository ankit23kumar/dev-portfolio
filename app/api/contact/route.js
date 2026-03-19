import axios from 'axios';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const EMAIL_ADDRESS = process.env.EMAIL_ADDRESS;
const GMAIL_PASSKEY = process.env.GMAIL_PASSKEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_ADDRESS,
    pass: GMAIL_PASSKEY,
  },
});

function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function isValidEmail(email = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateOwnerEmailTemplate({ name, email, message }) {
  return `
    <div style="font-family: Arial, sans-serif; color: #111827; background: #f3f4f6; padding: 24px;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background: #111827; color: #ffffff; padding: 20px 24px;">
          <h2 style="margin: 0; font-size: 22px;">New Portfolio Contact Message</h2>
        </div>

        <div style="padding: 24px;">
          <p style="margin: 0 0 12px;"><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p style="margin: 0 0 12px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p style="margin: 0 0 8px;"><strong>Message:</strong></p>

          <div style="background: #f9fafb; border-left: 4px solid #2563eb; padding: 16px; border-radius: 8px; white-space: pre-wrap; line-height: 1.6;">
            ${escapeHtml(message)}
          </div>

          <p style="margin-top: 20px; font-size: 13px; color: #6b7280;">
            Reply directly to this email to respond to the sender.
          </p>
        </div>
      </div>
    </div>
  `;
}

function generateConfirmationEmailTemplate({ name, message }) {
  return `
    <div style="font-family: Arial, sans-serif; color: #111827; background: #f3f4f6; padding: 24px;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background: #111827; color: #ffffff; padding: 20px 24px;">
          <h2 style="margin: 0; font-size: 22px;">Thanks for reaching out</h2>
        </div>

        <div style="padding: 24px;">
          <p style="margin: 0 0 12px;">Hi ${escapeHtml(name)},</p>

          <p style="margin: 0 0 12px; line-height: 1.7;">
            Thanks for contacting me through my portfolio website. I have received your message and will get back to you as soon as possible.
          </p>

          <p style="margin: 20px 0 8px;"><strong>Your message:</strong></p>

          <div style="background: #f9fafb; border-left: 4px solid #10b981; padding: 16px; border-radius: 8px; white-space: pre-wrap; line-height: 1.6;">
            ${escapeHtml(message)}
          </div>

          <p style="margin: 20px 0 0; line-height: 1.7;">
            Best regards,<br />
            Ankit Kumar
          </p>

          <p style="margin-top: 16px; font-size: 13px; color: #6b7280;">
            Sent from ${escapeHtml(NEXT_PUBLIC_APP_URL)}
          </p>
        </div>
      </div>
    </div>
  `;
}

async function sendOwnerEmail(payload) {
  const { name, email, message } = payload;

  const mailOptions = {
    from: `"Ankit Portfolio" <${EMAIL_ADDRESS}>`,
    to: EMAIL_ADDRESS,
    subject: `New Portfolio Message from ${name}`,
    replyTo: email,
    text: `New Portfolio Contact Message

Name: ${name}
Email: ${email}

Message:
${message}`,
    html: generateOwnerEmailTemplate(payload),
  };

  await transporter.sendMail(mailOptions);
}

async function sendConfirmationEmail(payload) {
  const { name, email, message } = payload;

  const mailOptions = {
    from: `"Ankit Kumar" <${EMAIL_ADDRESS}>`,
    to: email,
    subject: 'Thanks for reaching out - Message received',
    text: `Hi ${name},

Thanks for contacting me through my portfolio website. I have received your message and will get back to you as soon as possible.

Your message:
${message}

Best regards,
Ankit Kumar`,
    html: generateConfirmationEmailTemplate(payload),
  };

  await transporter.sendMail(mailOptions);
}

async function sendTelegramMessage(payload) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return { success: false, skipped: true, reason: 'Telegram is not configured.' };
  }

  const { name, email, message } = payload;

  const telegramMessage =
    `📩 New Portfolio Message\n\n` +
    `👤 Name: ${name}\n` +
    `📧 Email: ${email}\n\n` +
    `📝 Message:\n${message}`;

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    const res = await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: telegramMessage,
    });

    return { success: !!res.data?.ok, skipped: false };
  } catch (error) {
    console.error('Telegram send error:', error.response?.data || error.message);
    return { success: false, skipped: false, reason: 'Telegram send failed.' };
  }
}

export async function POST(request) {
  try {
    if (!EMAIL_ADDRESS || !GMAIL_PASSKEY) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email service is not configured properly.',
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const name = body?.name?.trim();
    const email = body?.email?.trim();
    const message = body?.message?.trim();

    if (!name || !email || !message) {
      return NextResponse.json(
        {
          success: false,
          message: 'Name, email, and message are required.',
        },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please enter a valid email address.',
        },
        { status: 400 }
      );
    }

    if (name.length > 100 || email.length > 150 || message.length > 5000) {
      return NextResponse.json(
        {
          success: false,
          message: 'Input is too long.',
        },
        { status: 400 }
      );
    }

    const payload = { name, email, message };

    // 1) This is the only required delivery
    await sendOwnerEmail(payload);

    // 2) Optional-but-recommended confirmation email
    let confirmationSent = false;
    try {
      await sendConfirmationEmail(payload);
      confirmationSent = true;
    } catch (error) {
      console.error('Confirmation email error:', error.message);
    }

    // 3) Optional Telegram alert
    const telegramResult = await sendTelegramMessage(payload);

    return NextResponse.json(
      {
        success: true,
        message: 'Your message has been sent successfully.',
        meta: {
          confirmationSent,
          telegramSent: telegramResult.success,
          telegramSkipped: telegramResult.skipped || false,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact API error:', error.message);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to send your message. Please try again later.',
      },
      { status: 500 }
    );
  }
}