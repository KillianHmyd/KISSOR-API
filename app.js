// BASE setup
// ------------------------------------------------------------------------ //

var express = require("express");
var app = express();
var router = express.Router();
var bodyParser = require("body-parser");
var graph = require('fbgraph');

// DATABASE : setup & configuration
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
// models
var User = require("./models/user");
var Event = require("./models/event");
var Participation = require("./models/participation");

// connexion
mongoose.connect("mongodb://localhost/kissor", function (err) {
    if (err) throw err;
});

// configuration to use bodyParser
// to get data from POST requests
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;


// ROUTES for our API
// ------------------------------------------------------------------------ //
var router = express.Router();

// middlewares
router.use(function (req, res, next) {
    console.log("URL REQUEST : " + req.method + " - " + req.url);
    // check if the user with that name exists
    // do some validations
    // add -dude to the name
    console.log("TOKEN : " + req.headers.token);

    graph.setAccessToken(req.headers.token);
    graph.get("me?fields=picture,id,first_name,last_name", function (err, fb_res) {
        if (err){
            res.send(err);
        }else {
            User.findOne({
                    userid: fb_res.id
                }, function (err, user) {
                    if (user == null) {
                        user = new User();
                        user.friends = [];
                    }
                    user.userid = fb_res.id;
                    user.first_name = fb_res.first_name;
                    user.last_name = fb_res.last_name;
                    user.photo_url = fb_res.picture.data.url;
                    user.token = req.headers.token;

                    user.save();

                    graph.get("me/friends", function (err, fb_res) {
                        User.findOne({
                            token: req.headers.token,
                        }).exec(function (err, user2) {
                            var i;
                            var finish = false;
                            for(i=0; i<fb_res.data.length; i++){
                                console.log(i);
                                var friend_id = fb_res.data[i].id;
                                User.findOne({userid : friend_id}, function(err, other_user){
                                    if(other_user != null){
                                        if(user.friends.indexOf(other_user.userid) <= -1) {
                                            user.friends.push(other_user.userid);
                                            user.save();
                                        }
                                    }
                                })
                            }
                            req.user = user;
                            console.log(user.friends);
                        }).then(function(){next()})
                    });
                }
            );
        }
    });
});


// ROUTES DEFINITION
// ------------------------------------------------------------------------ //

/**
 * Created by jesuisnuageux on 23/02/2016.
 */

router.route('/user')
    .get(function (req, res) {
        User.findOne({token: req.headers.token}).exec(function (err, user) {
            if (err) {
                console.log(err)
                res.send(err);
            }
            res.json(user);
        })
    });

router.route('/user/:userid')
    .get(function (req, res) {
        User.findOne({token: req.headers.token}).exec(function (err, user) {
            console.log(user)
            if (user.friends.indexOf(req.params.userid) > -1 || req.user.userid == req.params.userid) {
                User.findOne({userid: req.params.userid}).exec(function (err, user) {
                    res.json(user);
                })
            } else {
                res.send("Not a friend");
            }
        })
    })

router.route('/events')
    // create a new event
    .post(function (req, res) {
        graph.setAccessToken(req.headers.token);
        graph.get("me?fields=id", function(err, fb_res){
            if (err){
                res.send(err);
            }else {
                var event = new Event();
                event.latitude = req.body.latitude;
                event.longitude = req.body.longitude;
                event.date = new Date(req.body.date);
                event.created_by = fb_res.id;
                event.save(function (err) {
                    console.log(err);
                });
                res.json({
                    event: event,
                });
            }
        });
    })
    // get all events
    .get(function (req, res) {
        User.findOne({token: req.headers.token}).exec(function (err, user) {
            if(err)
                res.send(err)
            var allEvents = {lenght : 0, events: []};
            var inserted = 0;
            allEvents.total = 0;
            var i;
            if(user.friends.length == 0){
                res.json({
                    total : 0,
                    events : []
                })
            }
            else{
                user.friends.push(user.userid);
            }
            for(i = 0; i < user.friends.length; i++){
                Event.find({created_by: user.friends[i]}).exec(function (err, events) {
                    if (err) {
                        res.send(err);
                    }
                    allEvents.total += events.length
                    for(var j=0; j < events.length; j++){
                        allEvents.events.push(events[j]);
                    }
                    if(++inserted == user.friends.length){
                        res.json({
                            total : allEvents.total,
                            events : allEvents.events
                        })
                    }
                });
            }
        })
    });

router.route("/events/:eventid")
    .get(function (req, res) {
        Event.findById(req.params.eventid, function (err, event) {
            if (err) res.send(err);
            res.json({
                event: event
            });
        });
    })
    .put(function (req, res) {
        Event.findById(req.params.eventid, function (err, event) {
            if (err) res.send(err);
            var event = new Event()
            event.latitude = req.body.latitude || res.json({
                    error: "Invalid Parameter"
                });
            event.longitude = req.body.longitude || res.json({
                    error: "Invalid Parameter"
                });
            event.date = req.body.date || res.json({
                    error: "Invalid PArameter"
                });
            event.save();
            res.json({
                event: event,
            });
        })
    })
    .delete(function (req, res) {
        console.log(req.params.eventid);
        Event.remove({
            _id: req.params.eventid,
        }, function (err, event) {
            if (err) {
                res.send(err);
            }
            res.json({event: event})
        });

    });

router.route("/participation")
    .post(function(req,res){
        graph.setAccessToken(req.headers.token);
        graph.get("me?fields=id", function(err, fb_res){
            if (err){
                res.send(err);
            }else {
                var participation = new Participation();
                participation.eventid = req.body.eventid;
                participation.userid = fb_res.id;
                participation.save(function (err) {
                    console.log(err);
                });
                res.json({
                    participation: participation,
                });
            }
        });
    })

router.route("/participation/user")
    .get(function(req,res){
        User.findOne({token: req.headers.token}).exec(function (err, user) {
            if(err)
                res.send(err)
            var allParticipations = {lenght : 0, participations: []};
            allParticipations.total = 0;
            Participation.find({userid: user.userid}).exec(function (err, participations) {
                    if (err) {
                        res.send(err);
                    }
                    allParticipations.total += participations.length
                    for(var j=0; j < participations.length; j++){
                        allParticipations.participations.push(participations[j]);
                    }
                    res.json({
                        total : allParticipations.total,
                        participations : allParticipations.participations
                    })
                });
        })
    });


app.get('/', function (req, res) {
    res.json({
        message: "It works",
    })
});

// REGISTER ROUTES
// ------------------------------------------------------------------------ //
app.use('/api', router);

// START THE SERVER
// ------------------------------------------------------------------------ //
app.listen(port);
console.log("Magic is happening on : " + port);
