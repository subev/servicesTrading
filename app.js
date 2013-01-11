var express = require('express')
  , router = require('./routes/needs')
  , http = require('http')
  , path = require('path')
  , everyauth = require('everyauth')
  , auth = require('./infrastructure/auth')
  , moment = require('moment');

var app = express();

everyauth
    .twitter
    .consumerKey(auth.twitter.consumerKey)
    .consumerSecret(auth.twitter.consumerSecret)
    .findOrCreateUser( function (sess, accessToken, accessSecret, twitUser) {
        return usersByTwitId[twitUser.id] || (usersByTwitId[twitUser.id] = addUser('twitter', twitUser));
    })
    .redirectPath('/');

//copied from example
everyauth.everymodule
    .findUserById( function (id, callback) {
        callback(null, usersById[id]);
    });

var usersByTwitId = {};
var usersById = {};
var nextUserId = 0;
function addUser (source, sourceUser) {
    var user;
    if (arguments.length === 1) { // password-based
        user = sourceUser = source;
        user.id = ++nextUserId;
        return usersById[nextUserId] = user;
    } else { // non-password-based
        user = usersById[++nextUserId] = {id: nextUserId};
        user[source] = sourceUser;
    }
    return user;
}

//end of example copy

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(everyauth.middleware(app));

  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
});


app.configure('development', function(){
  app.use(express.errorHandler());
});

app.locals.moment = moment;

function accessChecker(req,res,next){
    if(req.user) {
        next();
    }
    else{
        res.redirect('/login');
    }
};

app.get('/', router.index);
app.get('/login', router.login);
app.get('/all', router.all);
app.get('/create',accessChecker, router.create);
app.post('/create', router.saveNew);
app.get('/need/:id', router.need);


http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});


