var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

NeedsProvider = function(host, port) {
    this.db= new Db('node-mongo-needs', new Server(host, port, {auto_reconnect: true}, {}));
    this.db.open(function(){});
};



NeedsProvider.prototype.getCollection= function(colName,callback) {
    this.db.collection(colName, function(error, needsCollection) {
        if( error ) callback(error);
        else callback(null, needsCollection);
    });
};

NeedsProvider.prototype.findAll = function(callback) {
    this.getCollection('needs',function(error, needsCollection) {
        if( error ) callback(error)
        else {
            needsCollection.find().sort({createdAt:-1 }).toArray(function(error, results) {
                if( error ) callback(error)
                else callback(null, results)
            });
        }
    });
};


NeedsProvider.prototype.findById = function(id, callback) {
    this.getCollection('needs',function(error, needsCollection) {
        if( error ) callback(error)
        else {
            var parsedID = needsCollection.db.bson_serializer.ObjectID.createFromHexString(id);
            needsCollection.findOne({_id: parsedID}, function(error, result) {
                if( error ) callback(error)
                else callback(null, result)
            });
        }
    });
};

NeedsProvider.prototype.save = function(needs, callback) {
    this.getCollection('needs',function(error, needsCollection) {
        if( error ) callback(error)
        else {
            if( typeof(needs.length)=="undefined")
                needs = [needs];

            for( var i =0;i< needs.length;i++ ) {
                var need = needs[i];
                need.createdAt = new Date();
                if( need.comments === undefined ) need.comments = [];
                for(var j =0;j< need.comments.length; j++) {
                    need.comments[j].createdAt = new Date();
                }
            }

            needsCollection.insert(needs, function() {
                callback(null, needs);
            });
        }
    });
};

//not sure if it will work without {_id: article_collection.db.bson_serializer.ObjectID.createFromHexString(articleId)},
NeedsProvider.prototype.addCommentToNeed = function(needId,comment,callback){
  this.getCollection('needs',function(error,needsCollection){
      if(error) callback(error)
      else{
          needsCollection.update(
              {_id:needsCollection.db.bson_serializer.ObjectID.createFromHexString(needId)},
              { '$push':{
                  comments:comment
                }
              },
              function(){
                  callback(null,comment)
              }
          )
      }
  })
};

exports.NeedsProvider = NeedsProvider;