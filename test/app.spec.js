const should = require('should');
const request = require('supertest');
const assert = require('assert');
const app = require('../app');
const client = require('../cache_redis');

describe('Basic Testing /test', ()=>{
    it('GET mongo_test should return 200 status code', (done) =>{
        request(app)
            .get('/test/mongo_test')
            .expect(200)
            .end( (err, res)=> {
                if(err) throw err;
                done();
            });
    });

    it('POST join_test should return 200 status code', (done) => {
        request(app)
             .post('/test/join_test')
             .send({
                 nickname : "test",
                 uid : "tes12t@test.com",
                 password : "dsfdsdsfdsfsd",
             })
             .expect(200)
             .end ( (err, res) => {
                 if(err) throw err;
                 done();
             });
             
     }).timeout(10000);

     it('GET login_test should return 200 status code', (done) => {
        request(app)
             .post('/test/login_test')
             .send({
                 uid : "tes12t@test12.com",
                 password : "dsfdsdsfdsfsd",
             })
             .expect(200)
             .end ( (err, res) => {
                 if(err) throw err;
                 done();
             });
             
     });

     it('GET token_test should return 200 status code', (done) => {
        request(app)
             .post('/test/token_test')
             .send({
                 uid : "tes12t@test12.com",
                 password : "dsfdsdsfdsfsd",
             })
             .expect(200)
             .end ( (err, res) => {
                 if(err) throw err;
                 done();
             });
             
     });

     it('GET token_test should return 400 status code', (done) => {
        request(app)
             .post('/test/token_test')
             .send({
                 uid : "tes213@test12.com",
                 password : "dsfdsdsfdsfs213d",
             })
             .expect(400)
             .end ( (err, res) => {
                 if(err) throw err;
                 done();
             });
             
     });

     it('GET redis_test should return 200 status code', (done) => {
        request(app)
             .get('/test/redis_test')
             .expect(200)
             .end ( (err, res) => {
                 if(err) throw err;
                 done();
             });
             
     });

     it('POST join_redis test should return 200 status code', (done) => {
        request(app)
             .post('/test/join_redis_test')
             .send({
                 nickname : "test3023222232232222",
                 uid : "tesf2222222223@test.com",
                 password : "dsfdsdsfdsfsd",
             })
             .expect(200 || 300)
             .end ( (err, res) => {
                 if(err) throw err;
                 done();
             });
             
     }).timeout(10000);

     it('GET confirmEmail test should return 200 status code', (done) => {
        request(app)
             .get('/test/confirmEmail_test?key=abcde')
             .expect(200)
             .end ( (err, res) => {
                 if(err) throw err;
                 done();
             });
             
     });


});