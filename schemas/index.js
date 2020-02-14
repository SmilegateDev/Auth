const mongoose = require('mongoose');


//몽고 DB 연결
module.exports = () =>{
    const connect = () =>{

        if(process.env.NODE_ENV !== 'production'){
            mongoose.set('debug', true);
        }

        //mongoose.connect('mongodb://root:root@localhost:27017/admin', {
        mongoose.connect('mongodb://localhost:27017/test', {
            dbName: 'nodejs',
        }, (error) => {
            if(error){
                console.log('몽고디비 연결 에러', error);
            }

            else{
                console.log('몽고디비 연결 성공');
            }

        });

    };

    connect();
    mongoose.connection.on('error', (error)=>{
        console.error('몽고 디비 연결 에러', error);
    });

    mongoose.connection.on('disconnected', ()=> {
        console.error('몽고 디비 연결이 끊어졌습니다. 연결을 재시도 합니다');
        connect();
    });

    require('./user');
  //  require('./comment');
    require('./post');

};