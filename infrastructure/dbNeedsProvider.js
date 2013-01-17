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
                    user.needRating = 0;
                    user.needRegistration = new Date();

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
            {
                '$pull':{
                    applied:userId
                }
            },
            function(){
                callback(null)
            }
        )
    })
}

NeedsProvider.prototype.cancelIfPending = function(needId,userId,callback){
    this.getCollection('needs',function(error,needsCollection){
        needsCollection.update(
            {
                _id:needsCollection.db.bson_serializer.ObjectID.createFromHexString(needId),
                currentApplicantId:userId
            },
            {
                '$set':{
                    currentApplicantId:0,
                    status:'open'
                }
            },
            function(){
                callback(null)
            }
        )
    })
}

NeedsProvider.prototype.getAppliedUserForOffer = function(userIds,callback){
    this.getCollection('users',function(error,users){
        if(error) callback(error)
        else{
            users.find({'id':{'$in':userIds}}).toArray(function(err,result){
                callback(null,result)
            })
        }
    })
}

NeedsProvider.prototype.accept = function(needId,currentUserId,applicantId,callback){
    var that = this;
    that.findById(needId,function(error,need){
        if(need.author.id!=currentUserId){
            callback(new Error("The author and the one trying to accept does not match!"))
        }
        else if(error){
            callback(error)
        }
        else{
            that.getCollection('needs',function(err,needsCollection){
                needsCollection.update(
                    {_id:needsCollection.db.bson_serializer.ObjectID.createFromHexString(needId)},
                    {
                        '$set':{
                            status:'inProgress',
                            currentApplicantId:applicantId
                        }
                    },
                    function(){
                        callback(null)
                    }
                )
            })
        }
    })
}

NeedsProvider.prototype.dismiss = function(needId,authorId,callback){
    this.getCollection('needs',function(error,needsCollection){
        needsCollection.update(
            {
                "_id":needsCollection.db.bson_serializer.ObjectID.createFromHexString(needId),
                "author.id":authorId
            },
            {
                '$set':{
                    currentApplicantId:0,
                    status:'open'
                }
            },
            function(){

                callback(null)
            }
        )
    })
}

NeedsProvider.prototype.ownerMark = function(needId,ownerId,callback){
    var that = this;
    that.getCollection('needs',function(error,needsCollection){
        needsCollection.update(
            {
                _id:needsCollection.db.bson_serializer.ObjectID.createFromHexString(needId),
                'author.id':ownerId
            },
            {
                '$set':{
                    ownerMarked:true
                }
            },
            function(){
                that.updateToCompletedIfNeed(needId,callback);
            }
        )
    })
}

NeedsProvider.prototype.applicantMark = function(needId,applicantId,callback){
    var that=this;
    that.getCollection('needs',function(error,needsCollection){
        needsCollection.update(
            {
                _id:needsCollection.db.bson_serializer.ObjectID.createFromHexString(needId),
                'currentApplicantId':applicantId
            },
            {
                '$set':{
                    applicantMarked:true
                }
            },
            function(){
                console.log('1111',callback)
                that.updateToCompletedIfNeed(needId,callback);
            }
        )
    })
}

NeedsProvider.prototype.updateToCompletedIfNeed = function(needId,callback){
    console.log('2222',callback)
    var that = this;
    that.findById(needId,function(error,need){
        console.log('3333',callback)
        if(need.ownerMarked&&need.applicantMarked){
            console.log('4444',callback)
            that.getCollection('needs',function(error,needsCollection){
                needsCollection.update({
                        _id:needsCollection.db.bson_serializer.ObjectID.createFromHexString(needId)
                    },
                    {
                        '$set':{
                            status:'completed',
                            completedDate:new Date()
                        }
                    },
                    callback
                    )
            })
        }
        else{
            callback(null)
        }
    })
}

exports.NeedsProvider = NeedsProvider;