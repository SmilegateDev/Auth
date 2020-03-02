const KakaoStrategy = require('passport-kakao').Strategy;

const { User } = require('../models');

module.exports = (passport) => {
  passport.use(new KakaoStrategy({
    clientID: process.env.KAKAO_ID,
    callbackURL: '/api/auth/kakao/callback',
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const exUser = await User.findOne({ where: { snsId: profile.id, provider: 'kakao' } }); //유저가 있는지 찾아봄
      if (exUser) {
        done(null, exUser);
      } 
      
      //유저가 없으면 새로생성
      else {
        const newUser = await User.create({
          email: 'NULL_CHANGE',
          nickname: 'NULL_CHANGE',
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