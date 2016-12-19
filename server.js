var express = require('express');
var app = express();
var mongo = require('mongodb').MongoClient;
var path = require('path');
var validUrl = require('valid-url');
var stylus = require('stylus');
//var mongoose = require('mongoose');

var html = path.join(__dirname, 'static/index.html')
var styles = path.join(__dirname, 'static/style.css');
var views = path.join(__dirname, 'templates');


app.use(stylus.middleware(styles));
//app.get(app.use(express.static(styles)))

app.set("view engine", "jade");
app.set('views', views);

var url = process.env.MONGOLAB_URI || "mongodb://localhost:" + process.env.PORT + "/shorturls";
var id = 1;
var hostUrl;

    
//mongoose.connect(process.env.MONGOLAB_URI);

//var shortUrls = mongoose.model({})
app.get('/', function(req,res){
    res.sendFile(html);
})

app.get('/url/*', function(req,res){
    
    hostUrl = req.headers['x-forwarded-proto'] +'://' + req.headers.host;
    console.log(hostUrl);
    
    var origUrl = req.url.replace("/url/", "");
    
    if(req.url=='/favicon.ico'){
         return;
    }
    
    if(validUrl.isUri(origUrl)){
        console.log('url is valid' + origUrl);
        
        mongo.connect(url, function(err, db){
            if(err){
                console.log(err)
                throw err;
            }
    
            var urls =db.collection("urls"); 
    
            urls.findOne({"original-url": origUrl}).then(function(found){
                if(found){
                    delete found['_id']
                    var original =found["original-url"];
                    var short = found["short-url"];
                    res.render("response", {original: original, short: short, link: found["short-url"]});
                }
                else{
                    var newDoc = {"original-url": origUrl, "short-url": hostUrl +'/' +id};
                    urls.insert(newDoc, function(err,data){
                        if(err){
                            throw err;
                        }
                        var output=data.ops[0]
                        delete output['_id'];
                    
                        var original =output["original-url"];
                        var short = output["short-url"];
                        res.render("response", {original: original, short: short, link: output["short-url"]});
                        
                    })
                    id++;
                    console.log(id);
                }
           
            })
         
        }) 
    }
    else{
        console.log('url is false ' + origUrl);
        res.send("Url is not valid.");
    }
})      
  
    
app.get('/*', function(req,res){
    console.log(req.headers.host + req.url)
    mongo.connect(url, function(err, db){
        if(err){
            console.log(err)
            throw err;
        }
        var urls=db.collection('urls');
        urls.findOne({"short-url": hostUrl + req.url}).then(function(found){
            if(found){
                console.log(found["original-url"])
                res.redirect(found["original-url"]);
            }
            else
            res.send("Short url was not found");
        })
        
    })
})



app.listen(process.env.PORT || 8080, function(){
    console.log('Listening on port ' + process.env.PORT);
});