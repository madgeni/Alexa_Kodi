
'use strict';

var AlexaSkill = require('./AlexaSkill');
/*
 protocol: conf.protocol,
 host: conf.host,
 port: conf.port,
 username: conf.username,
 password: conf.password
*/

var conf = require('./conf.json');

var APP_ID = conf.APP_Id;

var awsIot = require('aws-iot-device-sdk');
//conf.protocol
var device = awsIot.device({
    keyPath: conf.keyPath,
    certPath: conf.certPath,
    caPath: conf.caPath,
    clientId: conf.clientId,
    region: conf.region});


var Kodi = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
Kodi.prototype = Object.create(AlexaSkill.prototype);

Kodi.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    var speechText = "Welcome to Kodi, you can choose a movie, the next unwatched episode of a TV show, add subtitles, or update your library. What do you want to do?";

    var repromptText = "Welcome to Kodi, pick a film or a tv show";
    response.ask(speechText, repromptText);
};

var playMovie = function (intent, session, response) {
    console.log("intent: ", intent );
    var message = (intent.name + " " + intent.slots.Movie.value);
    console.log(message);
    device.publish('Incoming', JSON.stringify(message),function () {
        console.log('published successfully');
        var speechText = "OK Playing " + intent.slots.Movie.value;
        var speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.ask(speechOutput)
    })
};
var playNextShow = function (intent, session, response) {
    console.log("intent: ", intent );
    var message = (intent.name + " " + intent.slots.Show.value);
    console.log(message);
    device.publish('Incoming', JSON.stringify(message),function () {
        console.log('published successfully');
        var speechText = "OK Playing " + intent.slots.Show.value;
        var speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.ask(speechOutput)
    })
};
var kodiControl = function (intent, session, response) {

    var message = (intent.name);
    console.log("here? ", message);
    device.publish('Incoming', JSON.stringify(message),1, function () {
        console.log('published successfully');
        var speechText = "OK " + intent.name;
        var speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.ask(speechOutput)
    })
};

Kodi.prototype.intentHandlers = {
    'PlayMovie': function(intent, session, response) {
        playMovie(intent, session, response);
       //response.ask("OK")
    },
    'Stop': function(intent, session, response) {
        kodiControl(intent, session, response);
        //response.ask("OK")
    },
    'SubtitlesOn': function(intent, session, response) {
        kodiControl(intent, session, response);
        //response.ask("OK")
    },
    'SubtitlesOff': function(intent, session, response) {
        kodiControl(intent, session, response);
        //response.ask("OK")
    },
    'GetSubtitles': function(intent, session, response){
        kodiControl(intent, session, response);
    },
    'PlayPause': function(intent, session, response) {
        kodiControl(intent, session, response);
        //response.ask("OK")
    },
    'PlayNextEpisode': function(intent, session, response) {
        playNextShow(intent, session, response);
        //response.ask("OK")
    },
    'CleanVideo': function(intent, session, response) {
        kodiControl(intent, session, response);
        //response.ask("OK")
    },
    'UpdateVideo': function(intent, session, response) {
        kodiControl(intent, session, response);
        //response.ask("OK")
    },
    'GoodByeIntent': function(intent, session, response){
        var speechOutput = 'Goodbye';
        response.tell(speechOutput);
    },
    "AMAZON.HelpIntent": function (intent, session, response) {
        helpTheUser(intent, session, response);
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    }
};

exports.handler = function (event, context) {
    var kodi = new Kodi();
    kodi.execute(event, context);
};



