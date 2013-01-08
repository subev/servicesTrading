var repository = require('../infrastructure/needs-inmemory')
var provider = new repository.NeedsProvider();

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