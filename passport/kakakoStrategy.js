const KakaoStrategy = require('passport-kakao').Strategy;

const { User } = require('../models');

module.exports = (passport) => {
  passport.use(new KakaoStrategy({
    clientID: process.env.KAKAO_ID,
    callbackURL: '/api/auth/kakao/callback',
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const exUser = await User.findOne({ where: { snsId: profile.id, provider: 'kakao' } });
      if (exUser) {
        done(null, exUser);
      } 
      
      else {
        const newUser = await User.create({
          email: profile.account_email,
          nickname: profile.displayName,
          snsId: profile.id,
          provider: 'kakao',
          stauts : 2,
        });
        done(null, newUser);
      }
    
    
    } catch (error) {
      console.error(error);
      done(error);
    }
  }));
};