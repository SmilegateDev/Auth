const jwt = require('jsonwebtoken');
const RateLimit = require('express-rate-limit');

const client = require('../cache_redis');

exports.isLoggedIn = (req, res, next) =>{
    if(req.isAuthenticated()){
        next();
    }

    else{
        res.status(403).send('로그인 필요');
    }
};


exports.isNotLoggedIn = (req, res, next ) => {
    if(!req.isAuthenticated()){
        next();
    }

    else{
        res.redirect('/'); //여기 수정해야함
    }
};


exports.verifyToken = (req, res, next) => {
    try{
        req.decoded = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);

        //이메일인증 제때 안하면 토큰 인증 X
        if(req.status === 1){
            if(!client.get(req.nickname)){
                return res.status(401).json({
                    code : 401,
                    messgae : '유효하지 않는 토큰',
                });
            }
        }




        return next();
    }
    catch(error){
        if(error.name === 'TokenExpiredError'){

            
            return res.status(419).json({
                code : 419,
                messgae : '토큰이 만료',
            });
        }

        return res.status(401).json({
            code : 401,
            messgae : '유효하지 않는 토큰',
        });
    }
    
};


exports.apiLimiter = new RateLimit({
    windowMs : 60*1000,
    max : 9999,
    delayMs : 0,
    handler(req, res){
        res.status(this.statusCode).json({
            code : this.statusCode,
            message : '1분에 한 번만 요청할 수 있습니다.',
        });
    },
});


exports.deprecated = (req, res) =>{
    res.status(410).json({
        code : 410,
        messgae : '새로운 버전이 나왔습니다.',
    });
};