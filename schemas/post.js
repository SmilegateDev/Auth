const mongoose = require('mongoose');


const { Schema } = mongoose;
const { Types : {ObjectId}} = Schema;


const postSchema = new Schema({
    contents : {
        type : String,
        required : true,
    },

    writer : {
        type : String,
        required : true,
    },

    createdAt : {
        type : Date,
        default : Date.now,
    },
});


module.exports  = mongoose.model('post', postSchema);