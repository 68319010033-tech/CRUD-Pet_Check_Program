jest.mock('../services/emailService', () => ({
  generateSecureToken: jest.requireActual('../services/emailService').generateSecureToken,
  sendVerificationEmail: jest.fn().mockResolvedValue({ messageId: 'test-verify' }),
  sendPasswordResetEmail: jest.fn().mockResolvedValue({ messageId: 'test-reset' }),
  sendEmail: jest.fn().mockResolvedValue({ messageId: 'test' }),
  FRONTEND_URL: 'http://localhost:5173',
  BACKEND_URL: 'http://localhost:5000',
  isRealSmtpConfigured: false,
}));

const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../app');
const sequelize = require('../config/db');
const {
  User,
  Profile,
  EmailVerificationToken,
  PasswordResetToken,
} = require('../models');
const { generateAccessToken } = require('../utils/jwt');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

const uniqueEmail = (prefix) => `${prefix}.${Date.now()}.${Math.random().toString(16).slice(2)}@test.com`;

beforeAll(async () => {
  process.env.REQUIRE_EMAIL_VERIFICATION = 'true';
  process.env.MAX_FAILED_LOGIN_ATTEMPTS = '5';
  process.env.ACCOUNT_LOCK_MINUTES = '15';
  await sequelize.authenticate();
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Auth Upgrade Unit/API Tests', () => {
  test('Register creates user, profile, and sends verification email', async () => {
    const email = uniqueEmail('register');

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'secret123', display_name: 'Tester' });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(email);
    expect(res.body.accessToken).toBeUndefined();
    expect(sendVerificationEmail).toHaveBeenCalled();

    const user = await User.findOne({ where: { email } });
    expect(user).not.toBeNull();
    expect(user.is_email_verified).toBe(false);
    expect(user.role).toBe('user');

    const profile = await Profile.findOne({ where: { user_id: user.id } });
    expect(profile.display_name).toBe('Tester');

    const tokenRow = await EmailVerificationToken.findOne({ where: { user_id: user.id } });
    expect(tokenRow).not.toBeNull();
  });

  test('Login succeeds only after email verification', async () => {
    const email = uniqueEmail('login');
    const password = 'secret123';

    await request(app)
      .post('/api/auth/register')
      .send({ email, password, display_name: 'Login User' });

    const blocked = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    expect(blocked.status).toBe(403);
    expect(blocked.body.code).toBe('EMAIL_NOT_VERIFIED');

    const user = await User.findOne({ where: { email } });
    const tokenRow = await EmailVerificationToken.findOne({ where: { user_id: user.id } });

    const verified = await request(app)
      .post('/api/auth/verify-email')
      .send({ token: tokenRow.token });

    expect(verified.status).toBe(200);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    expect(login.status).toBe(200);
    expect(login.body.accessToken).toBeDefined();
    expect(login.body.refreshToken).toBeDefined();
    expect(login.body.user.role).toBe('user');
  });

  test('Reset password works once and rejects reused token', async () => {
    const email = uniqueEmail('reset');
    const password = 'oldpass123';
    const password_hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password_hash,
      role: 'user',
      is_email_verified: true,
      is_active: true,
    });
    await Profile.create({ user_id: user.id, display_name: 'Reset User' });

    const forgot = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email });

    expect(forgot.status).toBe(200);
    expect(sendPasswordResetEmail).toHaveBeenCalled();

    const resetRow = await PasswordResetToken.findOne({
      where: { user_id: user.id, is_used: false },
    });
    expect(resetRow).not.toBeNull();

    const reset = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: resetRow.token, newPassword: 'newpass123' });

    expect(reset.status).toBe(200);

    const reused = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: resetRow.token, newPassword: 'anotherpass' });

    expect(reused.status).toBe(400);

    const loginOld = await request(app)
      .post('/api/auth/login')
      .send({ email, password });
    expect(loginOld.status).toBe(401);

    const loginNew = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'newpass123' });
    expect(loginNew.status).toBe(200);
  });

  test('RBAC: non-admin is forbidden from admin routes; admin succeeds', async () => {
    const userPassword = await bcrypt.hash('userpass1', 10);
    const adminPassword = await bcrypt.hash('adminpass1', 10);

    const normalUser = await User.create({
      email: uniqueEmail('rbac-user'),
      password_hash: userPassword,
      role: 'user',
      is_email_verified: true,
      is_active: true,
    });
    await Profile.create({ user_id: normalUser.id, display_name: 'Normal' });

    const adminUser = await User.create({
      email: uniqueEmail('rbac-admin'),
      password_hash: adminPassword,
      role: 'admin',
      is_email_verified: true,
      is_active: true,
    });
    await Profile.create({ user_id: adminUser.id, display_name: 'Admin' });

    const userToken = generateAccessToken(normalUser);
    const adminToken = generateAccessToken(adminUser);

    const forbidden = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`);

    expect(forbidden.status).toBe(403);

    const allowed = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(allowed.status).toBe(200);
    expect(allowed.body.data).toBeDefined();
    expect(allowed.body.pagination).toBeDefined();
  });

  test('Brute-force guard locks account after 5 failed logins', async () => {
    const email = uniqueEmail('lock');
    const password_hash = await bcrypt.hash('correct-pass', 10);

    const user = await User.create({
      email,
      password_hash,
      role: 'user',
      is_email_verified: true,
      is_active: true,
      failed_login_attempts: 0,
    });
    await Profile.create({ user_id: user.id, display_name: 'Lock User' });

    for (let i = 0; i < 4; i += 1) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'wrong-pass' });
      expect(res.status).toBe(401);
    }

    const locked = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'wrong-pass' });

    expect(locked.status).toBe(403);
    expect(locked.body.locked_until).toBeDefined();

    await user.reload();
    expect(user.locked_until).not.toBeNull();
  });
});
