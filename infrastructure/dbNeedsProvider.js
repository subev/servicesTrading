var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

NeedsProvider = function(host, port) {
    var that=this;
    that.db= new Db('node-mongo-needs', new Server(host, port, {auto_reconnect: true}, {}));
    that.db.open(function(){
        that.getCollection('needs',function(err,needsCollection){
            needsCollection.ensureIndex( {
                'tags': 1,
                'currentApplicantId' :1,
                'author.id':1
            });
        });

        that.getCollection('users',function(err,needsCollection){
            needsCollection.ensureIndex( {
                'id': 1
            });
        });
    });


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

NeedsProvider.prototype.getNeedsWhichUserCompleted= function(userId,callback){
    this.getCollection('needs',function(error,needs){
        if(error) callback(error)
        else{
            needs.find({'currentApplicantId':userId,status:'completed'}).toArray(function(err,result){
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
                    status:'open',
                    applicantMarked:false,
                    ownerMarked:false
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
                    status:'open',
                    applicantMarked:false,
                    ownerMarked:false
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
                that.updateToCompletedIfNeed(needId,callback);
            }
        )
    })
}

NeedsProvider.prototype.updateToCompletedIfNeed = function(needId,callback){
    var that = this;
    that.findById(needId,function(error,need){
        if(need.ownerMarked&&need.applicantMarked){
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

NeedsProvider.prototype.vote = function(needId,userId,positive,callback){
    var that = this;
    that.findById(needId,function(error,need){
        if(need.status=='completed'&&
            (need.author.id==userId||need.currentApplicantId==userId))
        {
            var points = 5;
            positive||(points=-points);
            if(!need.va&&userId==need.author.id){
                that.getCollection('needs',function(err,needsCollection){
                    if(err) callback(err)
                    else{
                        needsCollection.update({
                            _id:needsCollection.db.bson_serializer.ObjectID.createFromHexString(needId)
                        },
                        { $set:{va:true} },
                        function(err){
                            if(err) callback(err)
                            else that.rateUser(need.currentApplicantId,points,callback)
                        })
                    }
                })
            }
            else if(!need.vw&&userId==need.currentApplicantId){
                that.getCollection('needs',function(err,needsCollection){
                    if(err) callback(err)
                    else{
                        needsCollection.update({
                                _id:needsCollection.db.bson_serializer.ObjectID.createFromHexString(needId)
                            },
                            { $set:{vw:true} },
                            function(err){
                                if(err) callback(err)
                                else that.rateUser(need.author.id,points,callback)
                            })
                    }
                })
            }
            else{
                callback(new Error('The user has probably already voted.'))
            }
        }
        else{
            callback(new Error('Either status is not completed or you do not have privileges to update'))
        }
    })
}

NeedsProvider.prototype.rateUser = function(userId,points,callback){
    this.getCollection('users',function(err,usersCollection){
        usersCollection.update({
            id:userId
        },
        {
            $inc:{ needRating:points }
        }
        ,callback)
    })
}

NeedsProvider.prototype.getTags = function(callback){
    this.getCollection('tags',function(err,tagsCollection){
        tagsCollection.find().toArray(function(error, results) {
            if( error ) callback(error)
            else callback(null, results)
        });
    })
}

NeedsProvider.prototype.addTag = function(tags, callback) {
    this.getCollection('tags',function(error, tagsCollection) {
        for(f in tags){
            tags[f] = {text:tags[f]}
        }

        if( error ) callback(error)
        else {
            if( typeof(tags.length)=="undefined")
                tags = [tags];
            for(var j =0;j< tags.length; j++) {
                console.log('Adding',{text:tags[j].text});
                tagsCollection.update({text:tags[j].text}, {$inc:{count:1}},{ upsert: true });
            }
        }
    });
};

exports.NeedsProvider = NeedsProvider;