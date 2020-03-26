'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

const sequelize = new Sequelize(
  config.database, config.username, config.password, config,
);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.User = require('./user')(sequelize, Sequelize);
db.Post = require('./post')(sequelize, Sequelize);
db.Reply = require('./reply')(sequelize, Sequelize);
db.Location = require('./location')(sequelize, Sequelize);
db.Follow = require('./follow')(sequelize, Sequelize);
db.Likes = require('./likes')(sequelize, Sequelize);


db.User.hasMany(db.Post);
db.Post.belongsTo(db.User);

db.User.hasMany(db.Reply);
db.Reply.belongsTo(db.Reply);


db.User.belongsToMany(db.User, {
  foreignKey : 'followingId',
  as : 'Followers',
  through : db.Follow,
});

//같은 테이블 끼리 N:M관계임
db.User.belongsToMany(db.User, {
  foreignKey : 'followerId',
  as : 'Followings',
  through : db.Follow,
});


module.exports = db;
