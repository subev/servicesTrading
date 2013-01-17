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
    .findOrCreateUser( function (sess, accessToken, accessSecret, twitUser){
        var userPromise = this.Promise();
        router.getOrCreateUser(twitUser,function(err,user){
            if(err) {
                userPromise.fail(err)
            }
            else{
                userPromise.fulfill(user)
            }
        })
        return userPromise;
    })
    .redirectPath('/');

everyauth.everymodule.findUserById(router.getUser);

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.use(express.static(path.join(__dirname, 'public')));
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

});


app.configure('development', function(){
  app.use(express.errorHandler());
});

//helpers
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
app.post('/addComment',accessChecker, router.addComment);
app.get('/user/:id',router.user);
app.get('/needsFor/:id',router.needsForUser);
app.get('/applyFor/:id',accessChecker,router.applyFor);
app.get('/cancelFor/:id',accessChecker,router.cancelFor);
app.get('/accept/:userId/:needId',accessChecker,router.accept);
app.get('/dismissApplicant/:needId',accessChecker,router.dismiss);
app.get('/ownerMark/:needId',accessChecker,router.ownerMark);
app.get('/applicantMark/:needId',accessChecker,router.applicantMark);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});


