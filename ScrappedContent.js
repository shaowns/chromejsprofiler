// Bring Mongoose into the app
var mongoose = require('mongoose');

// Needed for subdocument structure
var scriptSchema = require('./Script').schema;
var requestSchema = require('./Request').schema;

// The schema definition
var scrappedContentSchema = new mongoose.Schema({
    url: String,
    rank: Number,
    createdOn: { type: Date, default: Date.now },
    scripts: [scriptSchema],
    requests: [requestSchema],
    finalHtml: String
});

var ScrappedContent = mongoose.model('ScrappedContent', scrappedContentSchema);
module.exports = ScrappedContent;