var services = 1;

NeedsProvider = function(){};
NeedsProvider.prototype.dummyData = [];

NeedsProvider.prototype.findAll = function(callback) {
    callback( null, this.dummyData )
};

NeedsProvider.prototype.findById = function(id, callback) {
    var result = null;
    for(var i =0;i<this.dummyData.length;i++) {
        if( this.dummyData[i]._id == id ) {
            result = this.dummyData[i];
            break;
        }
    }
    callback(null, result);
};

NeedsProvider.prototype.save = function(needs, callback) {
    var currentNeeds = null;

    if( typeof(needs.length)=="undefined")
        needs = [needs];

    for( var i =0;i< needs.length;i++ ) {
        currentNeeds = needs[i];
        currentNeeds._id = services++;
        currentNeeds.createdAt = new Date();

        if( currentNeeds.comments === undefined )
            currentNeeds.comments = [];

        for(var j =0;j< currentNeeds.comments.length; j++) {
            currentNeeds.comments[j].createdAt = new Date();
        }
        this.dummyData[this.dummyData.length]= currentNeeds;
    }
    callback(null, needs);
};

/* Lets bootstrap with dummy data */
new NeedsProvider().save([
    {title: 'My washing machine is overheating', body: 'Body one',author:{name:"John"}, comments:[{author:'Bob<br/>', comment:'I know who can help you'}, {author:'Dave', comment:'No one can help you!'}]},
    {title: 'The refrigirator\'s freon needs to be changed', body: 'Body two',author:{name:"Jessica<br/>#{foo}"}},
    {title: 'Post three', body: 'Body three',author:{name:"Peter"}}
], function(error, needs){});

exports.NeedsProvider = NeedsProvider;