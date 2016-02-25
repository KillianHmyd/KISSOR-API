/**
 * Created by jesuisnuageux on 23/02/2016.
 */
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var User = require('./user');
var Event = require("./event");

var ParticipationSchema = new Schema({
    eventid: {
        type:String,
        //ref:'Event',
        required:true,
    },
    userid: {
        type:String,
        //ref:'User',
        required:true,
    },
});
module.exports = mongoose.model('Participation', ParticipationSchema);
