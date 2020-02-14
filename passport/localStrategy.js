const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const { User } = require('../models');

module.exports = (passport) => {
  passport.use(new LocalStrategy({
    usernameField: 'uid',
    passwordField: 'password',
  }, async (uid, password, done) => {
    try {
      const exUser = await User.findOne({ where: { uid } });
      if (exUser) {
        let dbPassword = exUser.password;
        let salt = exUser.salt;
        let hash = crypto.createHash("sha512").update(password + salt).digest("hex");
        const result = (dbPassword === hash);
        
        //const result = await bcrypt.compare(password, exUser.password);
        
        if (result) {
          done(null, exUser);
        }
        
        else {
          done(null, false, { message: '비밀번호가 일치하지 않습니다.' });
        }
      } 
      
      else {
        done(null, false, { message: '가입되지 않은 회원입니다.' });
      }
    } catch (error) {
      console.error(error);
      done(error);
    }
  }));
};