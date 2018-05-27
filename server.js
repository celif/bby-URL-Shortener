// set up express
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// init sqlite db
var fs = require('fs');
var dbFile = './.data/sqlite.db';
var exists = fs.existsSync(dbFile);
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbFile);
var shortURL = '';

// display index.html
app.get("", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

// get URL from user
app.get("/new/*", function (request, response) {
  var longURL = request.params[0];
  
  // kill process if parameter is missing
  if (longURL == '') {
    console.log("URL missing");
  }  
  db.serialize(function(){
  if (exists) {
    db.serialize(function() {
      // create table if it does not exist
      db.run('CREATE TABLE IF NOT EXISTS links (id INTEGER PRIMARY KEY AUTOINCREMENT, longLink LONGTEXT, shortLink LONGTEXT)');
      db.run("INSERT INTO links (longLink) VALUES ('" + longURL + "')");
      db.each("SELECT id, longLink from links WHERE longLink LIKE ('" + longURL + "')", function(err, value) {
        
      var uniqueID = value.id;
      console.log(uniqueID);
        
      // convert base 10 ID to base 62  
      function toBase62(num) {
      var str = "";
      var arr = [];
    
      while (num > 0) {
        if ((num % 62) > 0.1) {
          arr.push(num % 62);
        }  
        num = num / 62;
    }
      for (var i = arr.length-1; i >= 0; i--) {
        if (arr[i] >= 10 && arr[i] <= 35) {
          str += String.fromCharCode(arr[i]+55);
        }
        else if(arr[i] >= 36 && arr[i] <= 61) {
          str += String.fromCharCode(arr[i]+61);
        }
        else {
          str += Math.trunc(arr[i]).toString();
        }
    }
        return str;
}
   var newID = toBase62(uniqueID);
   console.log(newID);     
   shortURL = newID;
   db.serialize(function() {
     db.run("UPDATE links SET shortLink = ('" + shortURL + "') WHERE longLink LIKE ('" + longURL + "')");
     console.log(shortURL);
     db.each("SELECT id, longLink, shortLink from links WHERE longLink LIKE ('" + longURL + "')", function(err, value) {
       shortURL = value.shortLink;
       response.send("Shortened URL: bby.glitch.me/" + shortURL);
     });
  });
        
 });

});

  }
    // check if database has been created
    else {
      db.serialize(function() {
      db.run('CREATE TABLE links (id INTEGER PRIMARY KEY AUTOINCREMENT, longLink LONGTEXT, shortLink LONGTEXT)');
      db.run("INSERT INTO links (longLink) VALUES ('" + longURL + "')");  
        });
    }
    
 });
});
// get shortened link and send user to original
app.get('/*', function(request, response) {
  db.serialize(function() {
    db.each("SELECT id, longLink, shortLink from links WHERE shortLink LIKE ('" + request.params[0] + "')", function(err, value) {
     var newLink = value.shortLink;
     var oldLink = value.longLink;
     if (!oldLink.includes("http://")) {
       oldLink = "http://" + oldLink;
     }  
    console.log(oldLink);  
    if (request.params[0] == newLink) {
       response.status(301).redirect(oldLink);
  }
   
   });
 
  });
});

// listen for requests 
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
