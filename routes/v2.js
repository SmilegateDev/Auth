const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const url = require('url');

const { verifyToken, apiLimiter,deprecated } = require('./middlewares');
const { Domain, User, Post, Hashtag } = require('../models');


const mongoPost = require('../schemas/post'); 

const router = express.Router();

router.use(deprecated);

// router.use(async (req, res, next) => {
//     const domain = await Domain.findOne({
//       where: { host: url.parse(req.get('origin')).host },
//     });
//     if (domain) {
//       cors({ origin: req.get('origin') })(req, res, next);
//     } else {
//       next();
//     }
//   });

router.use(cors());

router.post('/token', apiLimiter, async (req, res) => {
    const { clientSecret } = req.body;

    try{
        const domain = await Domain.findOne({
            where : { clientSecret },
            include : { 
                model : User,
                attribute : [ 'nick', 'id' ],
            },
        });

        if(!domain){
            return res.status(401).json({
                code : 401,
                message : '등록되지 않는 도메인 입니다.',
            });
        }

        const token = jwt.sign({
            id : domain.user.id,
            nick :domain.user.nick,
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


//Test Code
router.get('/test', verifyToken, apiLimiter, (req, res)=>{
    res.json(req.decoded);
});


router.get('/posts/my', verifyToken, apiLimiter, (req, res)=>{
    // Post.findAll({where : { userId : req.decoded.id} })
    //     .then( (posts)=>{
    //         console.log(posts);
    //         res.json({
    //             code : 200,
    //             payload : posts,
    //         });
    //     })
    //     .catch( (error)=>{
    //         console.error(error);
    //         return res.status(500).json({
    //             code : 500,
    //             message : '서버 에러',
    //         });
    //     } );

    mongoPost.find({writer : req.decoded.id}).populate('writer')
        .then((posts) =>{
            console.log(posts);
            res.json(posts);
        })
        .catch( (err) => {
            console.error(err);
            next(err);
        });

});


router.get('/posts/hashtag/:title', verifyToken, apiLimiter, async (req, res)=>{
    try{
        const hashtag = await Hashtag.findOne({ where : {title : req.params.title} });

        if(!hashtag){
            return res.status(404).json({
                code : 404,
                message : '검색 결과가 없습니다.',
            });
        }

        const posts = await hashtag.getPosts();
        return res.json({
            code : 200,
            payload : posts,
        });

    }

    catch(error){
        console.error(error);
        return res.status(500).json({
            code : 500,
            message : '서버 에러',
        });
    }
});

module.exports = router;