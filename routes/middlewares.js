const jwt = require('jsonwebtoken');
const RateLimit = require('express-rate-limit');
const client = require('../cache_redis');

//토큰 인증에 대한 미들웨어 함수
exports.verifyToken = (req, res, next) => {
    try{
        req.decoded = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);

        //이메일인증 제때 안하면 토큰 인증 X
        if(req.status === 1){
            return res.status(401).json({
                code : 401,
                messgae : '유효하지 않는 토큰',
            });
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

//새로운 버전이 나올때 구버전을 다운시키는 미들웨어
exports.deprecated = (req, res) =>{
    res.status(410).json({
        code : 410,
        messgae : '새로운 버전이 나왔습니다.',
    });
};