var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

NeedsProvider = function(host, port) {
    this.db= new Db('node-mongo-needs', new Server(host, port, {auto_reconnect: true}, {}));
    this.db.open(function(){});
};


NeedsProvider.prototype.getCollection= function(callback) {
    this.db.collection('router', function(error, article_collection) {
        if( error ) callback(error);
        else callback(null, article_collection);
    });
};

NeedsProvider.prototype.findAll = function(callback) {
    this.getCollection(function(error, article_collection) {
        if( error ) callback(error)
        else {
            article_collection.find().toArray(function(error, results) {
                if( error ) callback(error)
                else callback(null, results)
            });
        }
    });
};


NeedsProvider.prototype.findById = function(id, callback) {
    this.getCollection(function(error, needsCollection) {
        if( error ) callback(error)
        else {
            needsCollection.findOne({_id: needsCollection.db.bson_serializer.ObjectID.createFromHexString(id)}, function(error, result) {
                if( error ) callback(error)
                else callback(null, result)
            });
        }
    });
};

NeedsProvider.prototype.save = function(needs, callback) {
    this.getCollection(function(error, needsCollection) {
        if( error ) callback(error)
        else {
            if( typeof(needs.length)=="undefined")
                needs = [needs];

            for( var i =0;i< needs.length;i++ ) {
                article = needs[i];
                article.created_at = new Date();
                if( article.comments === undefined ) article.comments = [];
                for(var j =0;j< article.comments.length; j++) {
                    article.comments[j].created_at = new Date();
                }
            }

            needsCollection.insert(needs, function() {
                callback(null, needs);
            });
        }
    });
};

exports.NeedsProvider = NeedsProvider;