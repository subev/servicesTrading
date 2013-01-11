var NeedsProvider = require('../infrastructure/dbNeedsProvider.js').NeedsProvider
var provider = new NeedsProvider('localhost', 27017);

exports.index = function(req, res){
   res.render('index', { title: 'Service Trading'});
};

exports.login = function(req,res){
    res.render('login',{title:'Login'});
};

exports.all = function(req, res){
    provider.findAll(function(err,data){
        res.json({results:data});
    })
};

exports.create = function(req, res){
    res.render('create',{title:"New Post"});
};

exports.saveNew = function(req, res){

    provider.save({
        title: req.param('title'),
        body: req.param('body'),
        author: {
            name:req.user.twitter.name,
            id:req.user.twitter.id
        }
    }, function( error, docs) {
        res.redirect('/')
    });
}



exports.need= function(req, res) {
    provider.findById(req.params.id, function(error, need) {
        res.render('need',{
            need:need,
            title:need.title
        });
    });
};

//---------------------

// not implemented
//
//app.post('/blog/addComment', function(req, res) {
//    articleProvider.addCommentToArticle(req.param('_id'), {
//        person: req.param('person'),
//        comment: req.param('comment'),
//        created_at: new Date()
//    } , function( error, docs) {
//        res.redirect('/blog/' + req.param('_id'))
//    });
//});