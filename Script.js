// Bring Mongoose into the app
var mongoose = require('mongoose');

// The schema definition
var scriptSchema = new mongoose.Schema({
    scriptId: String,
    url: String,
    startLine: Number,
    startColumn: Number,
    endLine: Number,
    endColumn: Number,
    hash: String,
    failedToParse: Boolean,
    source: String
});

// For debug purposes only.
scriptSchema.methods.dumpToConsole = function () {
    console.log("-----Begin Script-----");
    console.log("Script ID: " + this.scriptId);
    if (this.url) {
        console.log("URL: " + this.url);
    }
    console.log("Start Line: " + this.startLine);
    console.log("Start Column: " + this.startColumn);
    console.log("End Line: " + this.endLine);
    console.log("End Column: " + this.endColumn);
    console.log("Hash: " + this.hash);
    console.log("Parse failed: " + this.failedToParse);

    console.log("-----Begin Script Source-----");
    console.log(this.source);
    console.log("-----End Script Source-----");

    console.log("-----End Script-----");
};

var Script = mongoose.model('Script', scriptSchema);
module.exports = {
    schema: scriptSchema,
    model: Script
}