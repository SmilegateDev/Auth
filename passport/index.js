const local = require('./localStrategy');
const kakao = require('./kakakoStrategy');
const sequelize = require('sequelize');
const { User } = require('../models');

module.exports = (passport) =>{

    //req.session 객체에 어떤 데이터를 저장할지 선택함. (매개변수 --> user)
    //첫번째 인자는 에러가 발생시 사용하는것이고 중요한것은 두번째 인자임
    //세션에 사용자 정보를 모두 저장하면 세션의 용량이 커지고 데이터 일관성에 문제가 발생하므로 사용자의 아이디만 저장
    passport.serializeUser((user, done)=>{
        done(null, user.id);
    });


    //매 요청시 실행됨, 세션에 저장했던 아이디를 받아 DB에서 사용자 정보를 저장
    passport.deserializeUser((id, done)=>{
        User.findOne({
            where : {id},
            include : [{
                model : User,
                attributes : ['id', 'nickname'],
                as : 'Followers',
            },
            {
                model : User,
                attributes : ['id', 'nickname'],
                as : 'Followings',
            }
        ],
        })
            .then(user => done(null, user))
            .catch(err => done(err));
        //User.accessedAt = sequelize.literal('now()');
        User.update({accessedAt: sequelize.literal('now()')}, {where: {uid : id}})
        .then(result => {
           res.json(result);
        })
        .catch(err => {
           console.error(err);
        });
    
    });

    local(passport);
    kakao(passport);
}