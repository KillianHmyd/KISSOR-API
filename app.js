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
    graph.get("me", function (err, fb_res) {
        User.findOne({
                userid: fb_res.id
            }, function (err, user) {
                if (user == null) {
                    user = new User();
                }
                user.userid = fb_res.id;
                user.name = fb_res.name;
                user.token = req.headers.token;
                user.save();

                graph.get("me/friends", function (err, fb_res) {
                    User.findOne({
                        token: req.headers.token,
                    }).populate('friends').exec(function (err, user) {
                        fb_res.data.forEach(function (friend) {
                            User.findOne({userid: friend.id}, function (err, other_user) {
                                if (other_user != null) {
                                    user.friends.push(friend.id);
                                }
                            });
                        });
                        console.log("current user : " + user);
                        user.save();
                        next();
                    })
                });
            }
        );
    });
});


// ROUTES DEFINITION
// ------------------------------------------------------------------------ //

/**
 * Created by jesuisnuageux on 23/02/2016.
 */

router.route('/user')
    .get(function (req, res) {
        User.findOne({token: req.headers.token}).populate('friends').exec(function (err, user) {
            if (err) {
                res.send(err);
            }
            res.json(user);
        })
    });

router.route('/user/:userid')
    .get(function (req, res) {
        User.findOne({token: req.headers.token}).populate("friends").exec(function (err, user) {
            if (friends.contains(req.params.userid)) {
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
        var event = new Event()
        event.latitude = req.body.latitude;
        event.longitude = req.body.longitude;
        event.date = new Date(req.body.date);
        event.create_by = req.body.token;
        event.save();
        res.json({
            event: event,
        });
    })
    // get all events
    .get(function (req, res) {
        Event.find(function (err, events) {
            if (err) {
                res.send(err);
            }
            res.json({
                total: events.length,
                events: events,
            });
        });
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

    })


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
