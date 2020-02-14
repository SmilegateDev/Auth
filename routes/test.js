const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const url = require('url');
const passport = require('passport');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
//const smtpTransport = require('nodemailer-smtp-transport');

const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { verifyToken, apiLimiter } = require('./middlewares');
const { User } = require('../models');
const client = require('../cache_redis');

var mongoUser = require('../schemas/user');


const router = express.Router();


//Mongo DB test
router.get('/mongo_test', function(req, res, next) {
  mongoUser.find({})
    .then((users)=>{
      res.send(200);
    })
    .catch((err)=>{
      console.error(err);
      next(err);
    });
});

//join test
router.post('/join_test', isNotLoggedIn, async (req, res, next) => {
  const { uid, nickname, password } = req.body;
  console.log("debug");
  try {
    const exUser = await User.findOne({ where: { uid } });
    if (exUser) {
      req.flash('joinError', '이미 가입된 이메일입니다.');
      return res.redirect(200, '/join');
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
    res.json({
      code : 200,
      uid,
      nickname,
      password,
      hash,
      salt,
    });

  } catch (error) {
    console.error(error);
    return next(error);
  }
});


//login_test
router.post('/login_test', isNotLoggedIn, (req, res, next) => {
  passport.authenticate('local', (authError, user, info) => {
    if (authError) {
      console.error(authError);
      return next(authError);
    }
    if (!user) {
      req.flash('loginError', info.message);
      return res.redirect(400, '/');
    }
    return req.login(user, (loginError) => {
      if (loginError) {
        console.error(loginError);
        return next(loginError);
      }
      return res.redirect(200, '/');
    });
    
    return res.status(200);

  })(req, res, next); // 미들웨어 내의 미들웨어에는 (req, res, next)를 붙입니다.
});


//token_test
router.post('/token_test', isNotLoggedIn, (req, res, next) => {
  passport.authenticate('local', (authError, user, info) => {
    if (authError) {
      console.error(authError);
      return next(authError);
    }
    if (!user) {
      req.flash('loginError', info.message);
      return res.redirect(400, '/');
    }
    return req.login(user, (loginError) => {
      if (loginError) {
        console.error(loginError);
        return next(loginError);
      }

      try{
        const token = jwt.sign({
            id : user.id,
            nickname : user.nickname,
        },
        process.env.JWT_SECRET,
        {
            expiresIn : '1m',
            issuer : 'nodebird',
        }
        );
        return res.json({
            code : 200,
            message : '토큰이 발급되었습니다.',
            token,
        });
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

  })(req, res, next); // 미들웨어 내의 미들웨어에는 (req, res, next)를 붙입니다.
});



//redis module test
router.get('/redis_test', function(req, res, next) {
  let test = "miss";
  
  client.set("miss", "miss", function(err, response){
  });

  client.get("miss", function(err, response){
    console.log(test + response);
    
    if(test === response){
      return res.status(200).send();
    }
    else{
      return res.status(400).send();
    }

  });

});


//join_redis_test
router.post('/join_redis_test', isNotLoggedIn, async (req, res, next) => {
  const { uid, nickname, password } = req.body;
  console.log("debug");
  try {
    const exUser = await User.findOne({ where: { uid } });
    if (exUser) {
      req.flash('joinError', '이미 가입된 이메일입니다.');
      return res.redirect(300, '/join');
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
    res.json({
      code : 200,
      uid,
      nickname,
      password,
      hash,
      salt,
    });

    //var emailKey = crypto.randomBytes(256).toString('hex').substr(100, 5);
    emailKey = "abcde";
    client.set(emailKey, nickname, "EX", 60*60*24, function(err, response){
        console.log(response);
    });

    client.set(nickname, 60*60*24, "EX", 60*60*24, function(err, response){
      console.log(response);
    });


    var smtpTransport = nodemailer.createTransport({
      service : 'gmail',
      auth : {
        user : process.env.GMAIL_ID,
        pass : process.env.GMAIL_PASS,
      }
    });

    var url = 'http://localhost:8002/test/confirmEmail_test'+'?key='+emailKey;
    var mailOpt = {
      from : process.env.GMAIL_ID,
      to : 'test@test.com',
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


    client.get(emailKey, function(err, response){
      if(response === nickname){
        console.log(response);
        return res.status(200).send();
      }
      else{
        return res.status(400).send();
      }
    });

  } catch (error) {
    return res.status(400).send();
    console.error(error);
    return next(error);
  }
});


router.get('/confirmEmail_test',function (req, res) {
  client.get(req.query.key, function(err, response){
    User.update({status : 2}, {where : {nickname : response}});
    if(response == "test3023222232232222"){
      return res.status(200).send();
    }
    else{
      return res.status(400).send();
    }

  });

});








module.exports = router;