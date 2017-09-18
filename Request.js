// Bring Mongoose into the app
var mongoose = require('mongoose');

// The schema definition
var requestSchema = new mongoose.Schema({
    url: String,
    timeFromPageLoad: Number
});

// For debug purposes only
requestSchema.methods.dumpToConsole = function(){
    console.log("-----Begin Request-----");
    console.log("URL: " + this.url);
    console.log("Time From Page Load: " + this.timeFromPageLoad);
    console.log("-----End Request-----");
};

var Request = mongoose.model('Request', requestSchema);
module.exports = {
    schema: requestSchema,
    model: Request
};