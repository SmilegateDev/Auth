const express = require('express');
const passport = require('passport');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { User } = require('../models');
const client = require('../cache_redis');

const router = express.Router();


function createEmailkey(email, nickname){
  var emailKey = crypto.randomBytes(256).toString('hex').substr(100, 5);
  
  //24시간내로 이메일 인증해야함
  client.set(emailKey, email, "EX", 60*60*24, function(err, response){
      console.log(response);
  });


  var smtpTransport = nodemailer.createTransport({
    service : 'gmail',
    auth : {
      user : process.env.GMAIL_ID,
      pass : process.env.GMAIL_PASS,
    }
  });

  var url = 'http://localhost:8001/auth/confirmEmail'+'?key='+emailKey;
  var mailOpt = {
    from : process.env.GMAIL_ID,
    to : email,
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

router.post('/join', async (req, res, next) => {
  const { email, nickname, password } = req.body;
  try {
    const exUser = await User.findOne({ where: { email } });
    if (exUser) {
      req.flash('joinError', '이미 가입된 이메일입니다.');
      return res.status(400).send("이미 가입된 메일입니다.");
    }
    let salt = Math.round((new Date().valueOf() * Math.random())) + "";
    let hash = crypto.createHash("sha512").update(password + salt).digest("hex");
    await User.create({
      email,
      nickname,
      password: hash,
      salt : salt,
    });


    await createEmailkey(email, nickname);

    //임시 만료기간을 닉네임을 통해 확인
    client.set(nickname, 60*60*24, "EX", 60*60*24, function(err, response){
    console.log(response);
  });


    return res.status(200).json({
      code : 200,
      msg  : "회원가입이 완료되었습니다."
    })
  } catch (error) {
    console.error(error);
    return next(error);
  }
});


//이메일 컨펌링크
router.get('/confirmEmail',function (req, res) {
  client.get(req.query.key, function(err, response){

    if(response !== null){
      User.update({status : 2}, {where : {email : response}});
      client.del(req.query.key); //이메일 인증이 완료되면 레디스에서 키가 삭제됨
      return res.status(200).json({
        code : 200,
        msg : "인증이 완료되었습니다."
      })
    }
    else{
      return res.status(400).json({
        code : "400",
        msg : "이미 만료된 링크이거나 잘못된 접근입니다."
      });
    }

    
  });
});



router.post('/login', (req, res, next) => {
  passport.authenticate('local', {session : false}, (authError, user, info) => {
    if (authError) {
      console.log("authError");
      console.error(authError);
      return next(authError);
    }

    //유저가 없으면 로그인 안됨
    if (!user) {
      req.flash('loginError', info.message);
      return res.status(500).json({
        code : 500,
        msg : "유저가 존재하지 않습니다"
      })
    }

    //이메일 인증링크가 만료됬을시에 다시 재등록
    if(!client.get(user.email)){
      createEmailkey(user.email, user.nickname);
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
            issuer : 'SmileGate_ESC',
        }
        );

        //refresh token 추가(30일 길이로 지정)
        const refreshToken = jwt.sign({
              id : user.id,
              nickname : user.nickname,
              user : user.status,
          },
          process.env.JWT_SECRET,
          {
              expiresIn : '30 days',
              issuer : 'SmileGate_ESC',
          }
        );

        //캐쉬에 리프레쉬토큰 등록(30일어치)
        client.set(refreshToken, token, "EX", 60*60*24*30);


        res.status(200).json({
            code : 200,
            message : '토큰이 발급되었습니다.',
            token,
            refreshToken,
        });

        return res.redirect('/');
    }

    catch(error){
        console.error(error);
        return res.status(500).json({
            code : 500,
            messgae : '서버 에러',
        });
    }

  })(req, res, next);
});


router.get('/checkoutNickname', (req,res)=>{
  User.findOne({where :{nickname : req.query.nickname}})
  .then(result =>{
    if(result == 0)
      return res.status(200).json({
        code : 200,
        msg : "닉네임을 사용할 수 있습니다."
      })
    else{
      return res.status(400).json({
        code : 400,
        msg :"닉네임이 이미 존재합니다."
      })
    }
  })
})


router.get('/checkoutEmail', (req,res)=>{
  User.findOne({where :{email : req.query.email}})
  .then(result =>{
    if(result == 0)
      return res.status(200).json({
        code : 200,
        msg : "이메일을 사용할 수 있습니다."
      })
    else{
      return res.status(400).json({
        code : 400,
        msg :"이메일이 이미 존재합니다."
      })
    }
  })
})

// router.get('/logout', isLoggedIn, (req, res) => {
//   req.logout();
//   //req.session.destroy();
//   res.status(200).json({
//     code : 200,
//     message : "logout",
//   })
// });

//카카오 로그인링크
router.get('/kakao', passport.authenticate('kakao', {session : false}));

router.get('/kakao/callback', passport.authenticate('kakao', { session : false,
  failureRedirect: '/',
}), (req, res) => {
  let user = req.user;
  
  try{
    const token = jwt.sign({
        id : user.id,
        nickname : user.nickname,
        status : user.status,
    },
    process.env.JWT_SECRET,
    {
        expiresIn : '1m',
        issuer : 'SmileGate_ESC',
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
          expiresIn : '30 days',
          issuer : 'SmileGate_ESC',
      }
    );

    //캐쉬에 등록 리프레쉬토큰 등록
    client.set(refreshToken, token, "EX", 60*60*24*30);


    res.status(200).json({
        code : 200,
        message : '토큰이 발급되었습니다.',
        token,
        refreshToken,
    });
    return res.redirect('/');
}

catch(error){
    console.error(error);
    return res.status(500).json({
        code : 500,
        messgae : '서버 에러',
    });
}


});


//토큰이 만료됬을때 재발급하는 URI
router.get('/token', async (req, res) => {
    
  const {nickname, id, status} = req.body;
  const refreshToken = req.body.refreshToken;

  try{
      if(refreshToken && client.get(refreshToken)){
          const token = jwt.sign({
              id : id,
              nickname : nickname,
              status : status,
          },
          process.env.JWT_SECRET,
          {
              expiresIn : '1m',
              issuer : 'SmileGate_ESC',
          }
          );

          //리프레쉬토큰을 key값으로 토큰 재등록
          client.set(refreshToken, token, "EX", 60*60);

          return res.status(200).json({
              code : 200,
              message : '토큰이 발급되었습니다.',
              token,
          });
      }
  }

  catch(error){
      console.error(error);
      return res.status(500).json({
          code : 500,
          messgae : '서버 에러',
      });
  }
});

module.exports = router;