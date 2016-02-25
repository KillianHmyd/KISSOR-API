var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

// MODELS
// ------------------------------------------------------------------------ //

var UserSchema = new Schema({
        userid: {
            type: String,
            required: true
        },
        token: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        photo_url: {
            type: String,
            //required:true
        },
        friends: {
            type:[String],
        }
    ,
    cache_since
:
{
    type: Date,
default:
    Date.now(),
    //required: true
}
,
})
;
module.exports = mongoose.model('User', UserSchema);

