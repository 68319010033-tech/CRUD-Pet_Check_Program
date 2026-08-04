const crypto = require('crypto');
const nodemailer = require('nodemailer');

const EMAIL_FROM = process.env.EMAIL_FROM || 'CozyTail <noreply@cozytail.local>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

let transporterPromise = null;

const createTransporter = async () => {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Dev fallback: Ethereal test account (or console logger if create fails)
  try {
    const testAccount = await nodemailer.createTestAccount();
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
  const info = await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    html,
    text,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`[EMAIL PREVIEW] ${previewUrl}`);
  }

  return info;
};

const sendVerificationEmail = async (user, token) => {
  const verifyUrl = `${FRONTEND_URL}/verify-email?token=${token}`;
  const apiUrl = `${BACKEND_URL}/api/auth/verify-email`;

  return sendEmail({
    to: user.email,
    subject: 'ยืนยันอีเมลบัญชี CozyTail',
    text: `ยืนยันอีเมลของคุณด้วย token: ${token}\nหรือเปิดลิงก์: ${verifyUrl}\nAPI: POST ${apiUrl} { "token": "${token}" }`,
    html: `
      <h2>ยินดีต้อนรับสู่ CozyTail</h2>
      <p>กรุณายืนยันอีเมลของคุณโดยกดปุ่มด้านล่าง หรือส่ง token ไปที่ API</p>
      <p><a href="${verifyUrl}">ยืนยันอีเมล</a></p>
      <p>Token: <code>${token}</code></p>
      <p>ลิงก์นี้จะหมดอายุตามที่ระบบกำหนด</p>
    `,
  });
};

const sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

  return sendEmail({
    to: user.email,
    subject: 'รีเซ็ตรหัสผ่าน CozyTail',
    text: `ตั้งรหัสผ่านใหม่ด้วย token: ${token}\nหรือเปิดลิงก์: ${resetUrl}`,
    html: `
      <h2>รีเซ็ตรหัสผ่าน</h2>
      <p>คุณได้ขอตั้งรหัสผ่านใหม่สำหรับบัญชี CozyTail</p>
      <p><a href="${resetUrl}">ตั้งรหัสผ่านใหม่</a></p>
      <p>Token: <code>${token}</code></p>
      <p>หากคุณไม่ได้เป็นผู้ขอ กรุณาเพิกเฉยอีเมลนี้</p>
    `,
  });
};

module.exports = {
  generateSecureToken,
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
};
