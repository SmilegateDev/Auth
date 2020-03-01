const express = require('express');
const uuidv4 = require('uuid/v4');
const { User, Domain, } = require('../models');


const router = express.Router();


router.get('/', (req, res, next)=>{
    User.findOne({
        where : {id : req.user && req.user.id || null},
    })
        .then( (user)=>{
            res.status(200).json({
                code : 200,
            });
        })
        .catch( (error)=> {
            next(error);
        });
});

module.exports = router;