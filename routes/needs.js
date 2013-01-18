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
            name:req.user.name,
            id:req.user.id
        },
        applied:[],
        status:'open'
    }, function( error, docs) {
        res.redirect('/')
    });
}



exports.need= function(req, res) {
    provider.findById(req.params.id, function(error, need) {
        if(error||!need){
            res.send(404,'Need could not be found!')
            return;
        }
        var isOwner = need.author.id==(req.user && req.user.id);
        var isCurrentApplicant = need.currentApplicantId === (req.user && req.user.id);

        if(isOwner || need.applied.length!=0){
            var appliedUsers = provider.getAppliedUserForOffer(need.applied,function(err,appliedUsers){
                if(err){
                    res.send(500,'Error getting users who applied for that need')
                }
                else{

                    if(need.currentApplicantId){
                        for(var i=0;i<appliedUsers.length;i++){
                            if(appliedUsers[i].id==need.currentApplicantId){
                                need.currentApplicant= appliedUsers[i];
                                break;
                            }
                        }

                    }


                    res.render('need',{
                        need:need,
                        title:need.title,
                        isOwner:isOwner,
                        appliedUsers:appliedUsers,
                        isCurrentApplicant:isCurrentApplicant
                    });
                }
            })
        }
        else{
            res.render('need',{
                need:need,
                title:need.title,
                isOwner:isOwner,
                appliedUsers:[],
                isCurrentApplicant:isCurrentApplicant
            });
        }
    });
};


exports.addComment = function (req, res) {
    provider.addCommentToNeed(req.param('_id'), {
        author: {
            name:req.user.name,
            id:req.user.id
        },
        body: req.body['comment'],
        createdAt: new Date()
        } ,
        function( error, comment) {
            if(error) throw error
            else {
                res.redirect('/need/'+req.param('_id'));
            }
    });
};


exports.getOrCreateUser = function(twitterUser,callback){
    provider.getOrCreateUser(twitterUser,function(err,user){
        if(err) callback(err)
        else callback(null,user)
    })
}

exports.getUser = function(id,callback){
    provider.getUserById(id,function(err,user){
        if(err) callback(err)
        else callback(null,user)
    })
}

exports.user = function(req,res){
    var id = parseInt(req.param('id'));
    provider.getUserById(id,function(err,user){
         res.render('user',{
             title:user.name,
             user:user
         })
    })
}

exports.needsForUser = function(req,res){
    var id = parseInt(req.param('id'));
    provider.getNeedsForUser(id,function(err,needs){
        res.json(needs)
    })
}

exports.needsWhichUserCompleted= function(req,res){
    var id = parseInt(req.param('id'));
    provider.getNeedsWhichUserCompleted(id,function(err,needs){
        res.json(needs)
    })
}

exports.applyFor = function(req,res){
    var needId = req.param('id');
    var userId = req.user.id ;
    provider.applyFor(needId,userId,function(err){
        if(err) res.send(500,'Applying failed')
        else res.send(200)
    })
}

exports.cancelFor = function(req,res){
    var needId = req.param('id');
    var userId = req.user.id ;

    var tasksRemaining = 2;
    provider.cancelFor(needId,userId,function(err){
        tasksRemaining--;
        if(tasksRemaining==0){
            if(err) res.send(500,'Canceling failed')
            else res.send(200)
        }
    })
    provider.cancelIfPending(needId,userId,function(err){
        tasksRemaining--;
        if(tasksRemaining==0){
            if(err) res.send(500,'Canceling failed')
            else res.send(200)
        }
    })
}

exports.accept = function(req,res){
    var needId = req.param('needId');
    var currentUserId = req.user.id ;
    var applicantId = parseInt(req.param('userId'));
    if(currentUserId == applicantId) send(500,"Applicant and owner could not be the same!")
    provider.accept(needId,currentUserId,applicantId,function(err){
        if(err) res.send(500,'Accepting failed')
        else res.redirect('/need/'+needId)
    })
}

exports.dismiss = function(req,res){
    var needId = req.param('needId');
    var authorId = parseInt(req.user.id) ;
    provider.dismiss(needId,authorId,function(err){
        if(err) res.send(500,'Dismissing failed')
        else res.redirect('/need/'+needId);
    })
}

exports.ownerMark = function(req,res){
    var needId = req.param('needId');
    var authorId = parseInt(req.user.id) ;
    provider.ownerMark(needId,authorId,function(err){
        if(err) res.send(500,'Marking failed')
        else res.send(200);
    })
}

exports.applicantMark = function(req,res){
    var needId = req.param('needId');
    var applicantId = parseInt(req.user.id) ;
    provider.applicantMark(needId,applicantId,function(err){
        if(err) res.send(500,'Marking failed')
        else res.send(200);
    })
}

exports.vote = function(req,res){
    var needId = req.param('needId');
    var type = req.param('type');
    var positive = type=="up" ? true:false;
    var userId = parseInt(req.user.id) ;
    provider.vote(needId,userId,positive,function(err){
        if(err) res.send(500,'Voting failed')
        else res.send(200);
    })
}
