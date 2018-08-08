var MongoClient = require('mongodb').MongoClient;
var config = require('../config/db');

MongoClient.connect(config.MONGO_URL, function(err, db) {
  if (err) throw err;
  var dbo = db.db(config.MONGO_DB);
  var query = { name: "Trovarius" };
  dbo.collection("users").find(query).toArray(function(err, result) {
    if (err) throw err;
    console.log(result);
    db.close();
  });
});