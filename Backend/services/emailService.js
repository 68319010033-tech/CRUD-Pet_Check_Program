const crypto = require('crypto');
const nodemailer = require('nodemailer');

const EMAIL_FROM = process.env.EMAIL_FROM || 'CozyTail <noreply@cozytail.local>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

const SMTP_HOST = (process.env.SMTP_HOST || '').trim();
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = (process.env.SMTP_USER || '').trim();
const SMTP_PASS = (process.env.SMTP_PASS || '').trim();
const SMTP_SERVICE = (process.env.SMTP_SERVICE || '').trim().toLowerCase(); // e.g. gmail

const isRealSmtpConfigured = Boolean(SMTP_HOST || SMTP_SERVICE) && Boolean(SMTP_USER) && Boolean(SMTP_PASS);

let transporterPromise = null;

const createTransporter = async () => {
  if (isRealSmtpConfigured) {
    const transportOptions = SMTP_SERVICE
      ? {
          service: SMTP_SERVICE,
          auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
          },
        }
      : {
          host: SMTP_HOST,
          port: SMTP_PORT,
          secure: SMTP_SECURE,
          auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
          },
        };

    const transporter = nodemailer.createTransport(transportOptions);

    try {
      await transporter.verify();
      console.log(
        `[EMAIL] Real SMTP ready (${SMTP_SERVICE || SMTP_HOST}:${SMTP_SERVICE ? 'service' : SMTP_PORT}) as ${SMTP_USER}`
      );
    } catch (error) {
      console.error('[EMAIL] SMTP verify failed:', error.message);
      throw new Error(
        `SMTP connection failed: ${error.message}. Check SMTP_HOST/SMTP_SERVICE, SMTP_USER, and SMTP_PASS (Gmail needs an App Password).`
      );
    }

    return transporter;
  }

  // Dev fallback: Ethereal test inbox (emails are NOT delivered to real mailboxes)
  try {
    const testAccount = await nodemailer.createTestAccount();
    console.warn('[EMAIL] SMTP not configured — using Ethereal preview inbox (not real delivery).');
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } catch (error) {
    console.warn('[EMAIL] Ethereal unavailable — logging emails to console only.');
    return {
      sendMail: async (mailOptions) => {
        console.log('[EMAIL DEV FALLBACK]', JSON.stringify(mailOptions, null, 2));
        return { messageId: `dev-${Date.now()}` };
      },
    };
  }
};

const getTransporter = async () => {
  if (!transporterPromise) {
    transporterPromise = createTransporter();
  }
  return transporterPromise;
};

const generateSecureToken = () => crypto.randomBytes(32).toString('hex');

const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = await getTransporter();
  const from = isRealSmtpConfigured
    ? (EMAIL_FROM.includes('@') ? EMAIL_FROM : `CozyTail <${SMTP_USER}>`)
    : EMAIL_FROM;

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`[EMAIL PREVIEW] ${previewUrl}`);
  } else if (isRealSmtpConfigured) {
    console.log(`[EMAIL SENT] to=${to} id=${info.messageId}`);
  }

  return info;
};

const sendVerificationEmail = async (user, token) => {
  // Frontend SPA route (works with nginx SPA fallback). Backend GET is a backup.
  const frontendUrl = `${FRONTEND_URL}/verify-email?token=${token}`;
  const apiUrl = `${BACKEND_URL}/api/auth/verify-email?token=${token}`;
  const primaryUrl = isRealSmtpConfigured ? frontendUrl : apiUrl;

  return sendEmail({
    to: user.email,
    subject: 'ยืนยันอีเมลบัญชี CozyTail',
    text: `ยินดีต้อนรับสู่ CozyTail\n\nกรุณายืนยันอีเมลโดยเปิดลิงก์นี้:\n${primaryUrl}\n\nหากลิงก์ด้านบนใช้ไม่ได้ ลองลิงก์สำรอง:\n${apiUrl}\n\nลิงก์จะหมดอายุตามที่ระบบกำหนด`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #2A2A2A;">
        <h2 style="color: #5E7463;">ยินดีต้อนรับสู่ CozyTail</h2>
        <p>กรุณายืนยันอีเมลของคุณเพื่อเปิดใช้งานบัญชี</p>
        <p style="margin: 24px 0;">
          <a href="${primaryUrl}"
             style="background:#7F9C86;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">
            ยืนยันอีเมล
          </a>
        </p>
        <p style="font-size: 13px; color: #666;">
          หากปุ่มกดไม่ได้ ให้เปิดลิงก์นี้:<br/>
          <a href="${primaryUrl}">${primaryUrl}</a>
        </p>
        <p style="font-size: 12px; color: #999;">ลิงก์สำรอง: <a href="${apiUrl}">${apiUrl}</a></p>
      </div>
    `,
  });
};

const sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

  return sendEmail({
    to: user.email,
    subject: 'รีเซ็ตรหัสผ่าน CozyTail',
    text: `คุณได้ขอตั้งรหัสผ่านใหม่สำหรับบัญชี CozyTail\n\nเปิดลิงก์นี้เพื่อตั้งรหัสผ่านใหม่:\n${resetUrl}\n\nหากคุณไม่ได้เป็นผู้ขอ กรุณาเพิกเฉยอีเมลนี้`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #2A2A2A;">
        <h2 style="color: #5E7463;">รีเซ็ตรหัสผ่าน</h2>
        <p>คุณได้ขอตั้งรหัสผ่านใหม่สำหรับบัญชี CozyTail</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}"
             style="background:#7F9C86;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">
            ตั้งรหัสผ่านใหม่
          </a>
        </p>
        <p style="font-size: 13px; color: #666;">
          หากปุ่มกดไม่ได้ ให้เปิดลิงก์นี้:<br/>
          <a href="${resetUrl}">${resetUrl}</a>
        </p>
        <p style="font-size: 12px; color: #999;">หากคุณไม่ได้เป็นผู้ขอ กรุณาเพิกเฉยอีเมลนี้</p>
      </div>
    `,
  });
};

module.exports = {
  generateSecureToken,
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  FRONTEND_URL,
  BACKEND_URL,
  isRealSmtpConfigured,
};
