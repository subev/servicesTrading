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
            needsCollection.find(null,{comments:0}).sort({createdAt:-1 }).toArray(function(error, results) {
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

NeedsProvider.prototype.getOrCreateUser = function(user,callback){
    this.getCollection('users',function(error,usersCollection){
        usersCollection.findOne({id:user.id},function(err,result){
            if(err) callback(err)
            else{
                if(result) callback(null,result)
                else{
                    usersCollection.insert(user,function(){
                        callback(null,user)
                    })
                }
            }
        })
    })
}

NeedsProvider.prototype.getUserById = function(userId,callback){
    this.getCollection('users',function(error,users){
        if(error) callback(error)
        else{
             users.findOne({id:userId},function(err,user){
                 callback(null,user)
             })
        }
    })
}

NeedsProvider.prototype.getNeedsForUser = function(userId,callback){
    this.getCollection('needs',function(error,users){
        if(error) callback(error)
        else{
            users.find({'author.id':userId}).toArray(function(err,result){
                callback(null,result)
            })
        }
    })
}

NeedsProvider.prototype.applyFor = function(needId,userId,callback){
    this.getCollection('needs',function(error,needsCollection){
        needsCollection.update(
            {_id:needsCollection.db.bson_serializer.ObjectID.createFromHexString(needId)},
            { '$addToSet':{
                    applied:userId
                }
            },
            function(){
                callback(null)
            }
        )
    })
}

NeedsProvider.prototype.cancelFor = function(needId,userId,callback){
    this.getCollection('needs',function(error,needsCollection){
        needsCollection.update(
            {_id:needsCollection.db.bson_serializer.ObjectID.createFromHexString(needId)},
            { '$pull':{
                applied:userId
            }
            },
            function(){
                callback(null)
            }
        )
    })
}

exports.NeedsProvider = NeedsProvider;