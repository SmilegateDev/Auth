const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { User } = require('../models');
const client = require('../cache_redis');

const router = express.Router();


function createEmailkey(nickname, uid){
  var emailKey = crypto.randomBytes(256).toString('hex').substr(100, 5);
  client.set(emailKey, nickname, "EX", 60*60*24, function(err, response){
      console.log(response);
  });


  var smtpTransport = nodemailer.createTransport({
    service : 'gmail',
    auth : {
      user : process.env.GMAIL_ID,
      pass : process.env.GMAIL_PASS,
    }
  });

  var url = 'http://localhost:8002/auth/confirmEmail'+'?key='+emailKey;
  var mailOpt = {
    from : process.env.GMAIL_ID,
    to : uid,
    subject : 'Emial verify',
    html : '<h1>For verifing, Please click the link</h1><br>' + url
  };

  smtpTransport.sendMail(mailOpt, function(err, res){
    if(err){
      console.log(err);
    }


    else{
      console.log('email has been sent');
    }

    console.log('success email')
    smtpTransport.close();

  });


}

router.post('/join', isNotLoggedIn, async (req, res, next) => {
  const { uid, nickname, password } = req.body;
  try {
    const exUser = await User.findOne({ where: { uid } });
    if (exUser) {
      req.flash('joinError', '이미 가입된 이메일입니다.');
      return res.status(400).send("이미 가입된 메일입니다.");
    }
    let salt = Math.round((new Date().valueOf() * Math.random())) + "";
    //const hash = await bcrypt.hash(password, 12); //여기에 SALT를 써야함
    let hash = crypto.createHash("sha512").update(password + salt).digest("hex");
    await User.create({
      uid,
      nickname,
      password: hash,
      salt : salt,
    });


    await createEmailkey(nickname, uid);

    //임시 만료기간을 닉네임을 통해 확인
    client.set(nickname, 60*60*24, "EX", 60*60*24, function(err, response){
    console.log(response);
  });


    return res.redirect('/');
  } catch (error) {
    console.error(error);
    return next(error);
  }
});



router.get('/confirmEmail',function (req, res) {
  client.get(req.query.key, function(err, response){
    if(response !== null){
      User.update({status : 2}, {where : {nickname : response}});
      client.del(req.query.key);
      return res.status(200).send();
    }

    else{
      return res.status(400).send();
    }
    
  });
});



router.post('/login', isNotLoggedIn, (req, res, next) => {
  passport.authenticate('local', (authError, user, info) => {
    console.log("authError");
    if (authError) {
      console.log("authError");
      console.error(authError);
      return next(authError);
    }

    if (!user) {
      req.flash('loginError', info.message);
      return res.status(500).send('Login Error');
    }
    return req.login(user, (loginError) => {
      if (loginError) {
        console.error(loginError);
        return next(loginError);
      }

      //이메일 인증링크가 만료됬을시에
      if(!client.get(user.uid)){
        createEmailkey(user.nickname, user.uid);
        return res.status(400).json({
          code : 400,
          messgae : '이메일 인증을 해주세요!',
      });
      }

      //로그인에 성공했으면 JWT 토큰 줘버리기
      try{
        const token = jwt.sign({
            id : user.id,
            nickname : user.nickname,
            status : user.status,
        },
        process.env.JWT_SECRET,
        {
            expiresIn : '1m',
            issuer : 'nodebird',
        }
        );

        //refresh token 추가
        const refreshToken = jwt.sign({
              id : user.id,
              nickname : user.nickname,
              user : user.status,
          },
          process.env.JWT_SECRET,
          {
              expiresIn : '60m',
              issuer : 'nodebird',
          }
        );

        //캐쉬에 등록
        client.set(refreshToken, token, "EX", 60*60*24*30);


        return res.status(200).json({
            code : 200,
            message : '토큰이 발급되었습니다.',
            token,
            refreshToken,
        }).send();
    }

    catch(error){
        console.error(error);
        return res.status(500).json({
            code : 500,
            messgae : '서버 에러',
        });
    }
    
    });
    
    return res.status(200);

  })(req, res, next);
});


router.get('/logout', isLoggedIn, (req, res) => {
  req.logout();
  req.session.destroy();
  res.redirect('/');
});

router.get('/kakao', passport.authenticate('kakao'));

router.get('/kakao/callback', passport.authenticate('kakao', {
  failureRedirect: '/',
}), (req, res) => {
  res.redirect('/');
});

module.exports = router;