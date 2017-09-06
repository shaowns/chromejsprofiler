var MongoClient = require('mongodb').MongoClient;

function DB() {
    // The MongoDB database connection.
    this.db = null;
}