/**
 * Created by jesuisnuageux on 23/02/2016.
 */

var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var User = require('./user');

var EventSchema = new Schema({
    created_by: {
        type:String,
        required: true,
    },
    latitude: {
        type:Number,
        required: true,
    },
    longitude: {
        type:Number,
        required: true,
    },
    date: {
        type:Date,
        required: true,
    },
});
var Event = mongoose.model('Event',EventSchema);
module.exports = Event;