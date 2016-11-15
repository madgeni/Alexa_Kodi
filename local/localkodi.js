var kodi = require('kodi-ws');

var awsIot = require('aws-iot-device-sdk');

var conf = require('./conf.json');


var device = awsIot.device({
    keyPath: conf.keyPath,
    certPath: conf.certPath,
    caPath: conf.caPath,
    keepalive: conf.keepalive,
    clientId: conf.clientId,
    clean: conf.clean,
    region: conf.region});

/*
var device = awsIot.device({
    keyPath: './certs/private.pem.key',
    certPath: './certs/certificate.pem.crt',
    caPath: './certs/root-CA.crt',
    keepalive: 5000,
    clientId: 'myMac',
    clean: true,
    region: 'us-east-1'});
    */

var movie;
var tvshow;
var tv;
var action;

device.on('connect', function () {
    console.log('connected to the server');
});
setTimeout(function(){
    device.subscribe('4Kodi', { qos: 0 });
}, 3000);

device.on('message', function (topic, message) {
    console.log(message.toString());

    if (topic == '4Kodi') {
        console.log('message', topic, message.toString());
        var msg = message.toString();

        var msgArray = msg.split(/(\s+)/);

        console.log(msgArray);
        action = msgArray[0];

        action = action.replace(/"/g,"");
        console.log("action is ", action);
        if (action.startsWith("PlayM")) {
            var tryme = msgArray.slice(2, msgArray.length);
            tryme = tryme.filter(function(str) {
                return /\S/.test(str);
            });
            console.log("trythis is" , tryme);
            movie = JSON.stringify(tryme);
           // movie = movie.substring(0, movie.length - 1);
            movie = movie.replace(/["']/g, "");
            movie = movie.replace(/\,/g, " ");
            movie = movie.replace(/\\"/g, '"');
            movie = movie.replace(/\\/g, "");
            movie = movie.replace(/[\[\]']+/g,'');
        }
        if (action.startsWith("PlayNext")) {

            var trythis = msgArray.slice(2, msgArray.length);
            //tvshow = JSON.stringify(trythis);
            trythis = trythis.filter(function(str) {
                return /\S/.test(str);
            });
            console.log("trythis is" , trythis);
            tvshow = JSON.stringify(trythis);
            console.log("string version is ", tvshow);
            //this needs some cleaning up - but currently mostly working
            tvshow = tvshow.replace(/["']/g, "");
            tvshow = tvshow.replace(/\,/g, " ");
            tvshow = tvshow.replace(/\\"/g, '"');
            tvshow = tvshow.replace(/\\/g, "");
            tvshow = tvshow.replace(/[\[\]']+/g,'');
            console.log("tv show is ", tvshow);
            if(tvshow.startsWith("west")){
                tvshow = tvshow[0].concat(tvshow[1]);
            }
            if(tvshow.startsWith("black")){
                tvshow = tvshow[0].concat(tvshow[1]);
            }
            //tv = tv.substring(0, tv.length - 2);
        }

    }

    kodi(conf.host, conf.port).then(function(connection) {

       console.log("action is ",action);
      // action = action.replace(/['"]+/g, ''[0]);

        action = action.replace(/['"]+/g, '');
      // action = action.trim();

        switch (action) {

            case 'PlayMovie':
              //  console.log("am i here?");
                console.log(movie);
                var resumeflag = false;
                return connection.VideoLibrary.GetMovies({
                    filter: {"operator": "contains", "field": "title", "value": movie},
                    properties: ['title', 'resume']

                }).then(function (movie) {
                    console.log(movie);
                    console.log(movie.movies[0].movieid);
                    var id = movie.movies[0].movieid;
                    var resume_movie = movie.movies[0].resume;

                    if (resume_movie > 0){
                        resumeflag = true
                    }
                    return connection.Player.Open({
                        item: {movieid: id},
                        options:{resume: resumeflag}})
                        .then(function Play() {
                      //  console.log('Movie ', id, 'started');
                    });
                });

                break;

            case 'PlayPause':
                console.log("here?");
                getplayer(function (callBack) {
                    //  console.log("is this the player id?", callBack);
                    var plyr = parseInt(callBack);
                    return connection.Player.PlayPause(plyr).then(function () {
                            console.log("play/pause")
                    });
                });
                break;

            case 'Stop':
                getplayer(function (callBack) {
                    var plyr = parseInt(callBack);
                    return connection.Player.Stop(plyr).then(function () {
                        console.log("stopped")
                    });
                });
                break;
            case 'SubtitlesOn':
                getplayer(function (callBack) {
                    var plyr = parseInt(callBack);
                    return connection.Player.SetSubtitle(plyr, 'on').then(function (subOff) {
                        console.log('Subtitles On');
                    });
                });
                break;

            case 'GetSubtitles':
                return connection.GUI.ActivateWindow({
                    "window":"subtitlesearch"}).then(function (subDL){
                    console.log('Subs downloaded');
                });
                break;

            case 'SubtitlesOff':
                getplayer(function (callBack) {
                    var plyr = parseInt(callBack);
                    return connection.Player.SetSubtitle(plyr, 'off').then(function (subOff) {
                        console.log('Subtitles Off?');
                    });
                });
                break;

            case 'CleanVideo':

                return connection.VideoLibrary.Clean().then(function (clean) {
                    console.log('cleaning video');
                });
                break;
            case 'UpdateVideo':

                return connection.VideoLibrary.Scan().then(function (clean) {
                    console.log('Scanning video');
                });
                break;
            case 'PlayNextEpisode':
                //let's try and get the latest episode to play
                getShowID(tvshow, function (returnme) {
                    console.log("do i get back here? ", returnme);
                    nextEp(returnme);
                });
                break;

            default:
                console.log('Something went wrong');
                break;
        }

    }).catch(function(e) {
        /* Handle errors */
        if(e.stack) {
            console.error(e.stack);
        } else {
            console.error(e);
        }
    }).then(function() {
       //nada - want this still open
    });

});

device.on("error", function(error) {
    console.log("ERROR: ", error);
});

device.on('offline', function() {
    console.log("offline");
});

device.on('reconnect', function() {
    console.log("reconnect");
});


function getplayer(callBack) {
    kodi(conf.host, conf.port).then(function(connection) {
            return connection.Player.GetActivePlayers().then(function (players) {
            var plyr = JSON.stringify(players[0].playerid);
            callBack(plyr);
        })
    })
}

function nextEp(tv_id) {
    kodi(conf.host, conf.port).then(function (connection) {

        return connection.VideoLibrary.GetEpisodes({
            "limits": {"end": 1},
            "tvshowid": tv_id,
            "filter": {"field": "lastplayed", "operator": "greaterthan", "value": "0"},
            "properties": ["season", "episode", "lastplayed", "firstaired", "resume", "file"],
            "sort": {"method": "lastplayed", "order": "descending"}
        }).then(function (nextEpisode) {
            console.log("wuh? ", nextEpisode);
            var episode_num = nextEpisode.episodes[0].episode;
            var episode_id = nextEpisode.episodes[0].episodeid;
            var episode_season = nextEpisode.episodes[0].season;
            var resume = nextEpisode.episodes[0].resume.position;
            var ep_file = nextEpisode.episodes[0].file;
            var next_episode_id;
            var playme;
            var resumeflag = false;
           // console.log("episode_no ", episode_num), " & season is ", episode_season;
            if (resume > 0) {
                playme = ep_file;
                resumeflag = true;
           /* } else {
                console.log("am i in getspecific? ep_season is ", episode_season);
                GetSpecificEpisode(tv_id, episode_season, episode_num + 1, function (callback) {
                    console.log(callback);
                    ep_file = callback;
                    return connection.Player.Open({
                        item: {file: ep_file},
                        options:{resume: resumeflag}})
                        .then(function Play() {
                            console.log('show ', Play, 'started');
                        });
                })*/
            }
            return connection.Player.Open({
                item: {file: ep_file},
                options:{resume: resumeflag}})
                .then(function Play() {
                console.log('show ', Play, 'started');
            });
            })
    });
}
function GetSpecificEpisode(show_id, season, episode, callback) {
    console.log("do i get to specific episode? id/season/episode", show_id, " ", season, " ", episode);
    return connection.VideoLibrary.GetEpisodes({
        "tvshowid": int(show_id),
        "season": int(season),
        "properties": ["season", "episode"]
    }).then(function (getNextEp) {
        var ep_file = getNextEp.episodes[0].file;
        callback(ep_file);
    });
}

function getShowID(tvshow, returnme) {
    kodi(conf.host, conf.port).then(function(connection) {
        return connection.VideoLibrary.GetTVShows({
            filter: {"operator": "contains", "field": "title", "value": tvshow},
            properties: ['title']
        }).then(function (shows) {
           // console.log("am i here? ", shows.tvshows[0].tvshowid);
            var showid = shows.tvshows[0].tvshowid;
            returnme(showid);
        })
    })
}
