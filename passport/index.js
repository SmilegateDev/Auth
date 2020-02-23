const local = require('./localStrategy');
const kakao = require('./kakakoStrategy');
const sequelize = require('sequelize');
const { User } = require('../models');

module.exports = (passport) =>{

    local(passport);
    kakao(passport);
}