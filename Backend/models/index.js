const User = require('./user');
const Profile = require('./profile');
const Pet = require('./pet');
const EmailVerificationToken = require('./emailVerificationToken');
const PasswordResetToken = require('./passwordResetToken');
const LoginActivityLog = require('./loginActivityLog');

User.hasOne(Profile, {
  foreignKey: 'user_id',
  as: 'profile',
  onDelete: 'CASCADE',
});

Profile.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

User.hasMany(EmailVerificationToken, {
  foreignKey: 'user_id',
  as: 'emailVerificationTokens',
  onDelete: 'CASCADE',
});

EmailVerificationToken.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

User.hasMany(PasswordResetToken, {
  foreignKey: 'user_id',
  as: 'passwordResetTokens',
  onDelete: 'CASCADE',
});

PasswordResetToken.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

User.hasMany(LoginActivityLog, {
  foreignKey: 'user_id',
  as: 'loginActivities',
  onDelete: 'SET NULL',
});

LoginActivityLog.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

module.exports = {
  User,
  Profile,
  Pet,
  EmailVerificationToken,
  PasswordResetToken,
  LoginActivityLog,
};
