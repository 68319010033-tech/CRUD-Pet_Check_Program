const User = require('./user');
const Profile = require('./profile');
const Pet = require('./pet');

User.hasOne(Profile, {
  foreignKey: 'user_id',
  as: 'profile',
  onDelete: 'CASCADE',
});

Profile.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

module.exports = {
  User,
  Profile,
  Pet,
};
