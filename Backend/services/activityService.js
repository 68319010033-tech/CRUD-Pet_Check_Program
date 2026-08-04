const { LoginActivityLog } = require('../models');

const getClientMeta = (req) => ({
  ip_address: req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim()
    || req.ip
    || req.socket?.remoteAddress
    || null,
  user_agent: req.headers['user-agent'] || null,
});

const logLoginActivity = async ({ userId = null, status, message = null, req }) => {
  const meta = getClientMeta(req);

  try {
    return await LoginActivityLog.create({
      user_id: userId,
      ip_address: meta.ip_address,
      user_agent: meta.user_agent,
      status,
      message,
    });
  } catch (error) {
    // Never fail auth flows because activity logging failed.
    console.warn('Failed to write login activity log:', error.message);
    return null;
  }
};

module.exports = {
  getClientMeta,
  logLoginActivity,
};
