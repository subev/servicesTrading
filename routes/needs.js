var NeedsProvider = require('../infrastructure/dbNeedsProvider.js').NeedsProvider
var provider = new NeedsProvider('localhost', 27017);

exports.all = function(req, res){
    provider.findAll(function(err,data){
        res.render('index', { title: 'Service Trading' ,needs:data});
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
            name:"not implemented!"
        }
    }, function( error, docs) {
        res.redirect('/')
    });
}

//---------------------

// not implemented

//app.get('/blog/:id', function(req, res) {
//    articleProvider.findById(req.params.id, function(error, article) {
//        res.render('blog_show.jade',
//            { locals: {
//                title: article.title,
//                article:article
//            }
//            });
//    });
//});
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