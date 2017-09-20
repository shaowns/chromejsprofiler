const CDP = require('chrome-remote-interface');
const chromeLauncher = require('chrome-launcher');
const delay = require('delay');
var cluster = require('cluster');
var nthline = require('nthline');

// Mongoose models
var DB = require('./DB');
var Script = require('./Script').model;
var Request = require('./Request').model;
var ScrappedContent = require('./ScrappedContent');

/**
 * Launches a debugging instance of Chrome.
 * 
 * @param {boolean=} headless True (default) launches Chrome in headless mode.
 * False launches a full version of Chrome.
 * @return {Promise<ChromeLauncher>}
 */
async function launchChrome(headless=true) {
  return chromeLauncher.launch({
    chromeFlags: [
      '--disable-gpu',
      headless ? '--headless' : ''
    ]
  });
}

/**
 * Process the scrapped materials from the URL.
 * 
 * @param {ScrappedContent} content 
  */
function processUrlContents(content) {
    for (let s of content.scripts) {
        s.dumpToConsole();
    }

    // Dump the requests to console.
    for (let r of content.requests) {
        r.dumpToConsole();
    }

    //console.log(finalHtml);
}

/**
 * Takes a string and scrapes off the sources, requests, and the
 * final page content from the given url.
 * 
 * @param {String} url
 * @param {Number} rank
 * @param {any} Network 
 * @param {any} Debugger 
 * @param {any} Page 
 * @param {any} Runtime 
 * @returns Object packed with the source scripts, requests, and the final page content.
 */
async function scrape(url, rank, Network, Debugger, Page, Runtime) {
    // The scrapped content model object.
    var content = new ScrappedContent();
    content.url = url;
    content.rank = rank;

    // Container for storing the script objects.
    var scripts = [];
    
    // Container for request objects.
    var requests = [];

    // Variable for start time reference point.
    var hrstart = null;

    // Setup handlers for: 
    // request about to be sent.
    Network.requestWillBeSent((params) => {
        let hrend = process.hrtime(hrstart);
        let elapsed = hrend[0] * 1000 + hrend[1]/1000000;

        var request = new Request();
        request.url = params.request.url;
        request.timeFromPageLoad = elapsed;
        requests.push(request);
    });

    // Scripts parsed.
    Debugger.scriptParsed(async (params) => {
        var script = new Script();
        script.scriptId = params.scriptId;
        script.url = params.url;
        script.startLine = params.startLine;
        script.startColumn = params.startColumn;
        script.endLine = params.endLine;
        script.endColumn = params.endColumn;
        script.hash = params.hash;
        script.failedToParse = false;

        // Fetch the source of the script from the debugger.
        // Retrieve the script source as a promise.
        let source = await Debugger.getScriptSource({scriptId: params.scriptId});
        script.source = source.scriptSource;
        scripts.push(script);
    });

    // Scripts failed to parse.
    Debugger.scriptFailedToParse(async (params) => {
        var script = new Script();
        script.scriptId = params.scriptId;
        script.url = params.url;
        script.startLine = params.startLine;
        script.startColumn = params.startColumn;
        script.endLine = params.endLine;
        script.endColumn = params.endColumn;
        script.hash = params.hash;
        script.failedToParse = true;

        // Fetch the source of the script from the debugger.
        // Retrieve the script source as a promise.
        let source = await Debugger.getScriptSource({scriptId: params.scriptId});
        script.source = source.scriptSource;
        scripts.push(script);
    });

    // Enable events, then start.
    await Promise.all([Network.enable(), Page.enable(), Debugger.enable()]);
    await Network.setCacheDisabled({cacheDisabled: true});

    // Timing start point and navigate to the url.
    hrstart = process.hrtime();
    await Page.navigate({url: url});
    await Page.loadEventFired();

    // Get the final html.
    const finalPageContent = await Runtime.evaluate({
        expression: 'document.documentElement.outerHTML'
    });

    /* 
    * Wait for 5000 ms before returning so that we can finish latching
    * onto any delayed request and consequent script content.
    * See https://github.com/shaowns/chromejsscrapper/issues/1
    */
    await delay(5000);

    // Save the scripts, requests, and the final html into the content object.
    content.scripts = scripts;
    content.requests = requests;
    content.finalHtml = finalPageContent.result.value;

    return content;
}

/**
 * Initiate the scrapping of sources and process the retrieved contents.
 * 
 * @param {String} url
 * @param {Number} rank 
 * @param {any} Network 
 * @param {any} Debugger 
 * @param {any} Page 
 * @param {any} Runtime 
 */
async function runAndProcessScrappedContents(url, rank, Network, Debugger, Page, Runtime) {
    // Get the scraped contents from the url given.
    let content = await scrape(url, rank, Network, Debugger, Page, Runtime);
    processUrlContents(content);
}

/**
 * Initializes the chrome instance in headless mode,
 * also initializes the chrome devtools protocol client.
 * 
 * @returns the chrome and the protocol client instance.
 */
async function init() {
    // Wait for chrome to launch
    var chrome = await launchChrome(true);
    
    // Connect to endpoint
    var client = await CDP({port: chrome.port});

    return {chrome: chrome, client: client};
}

/**
 * Main function that launches an instance of chrome
 * and retrieves the information from it through the
 * devtools protocol.
 * 
 * @param {any} startLine 
 * @param {any} endLine 
 */
async function runScrapper(startLine, endLine) {
    var chrome = null;
    var client = null;

    try {
        var agents = await init();
        // Expand into the required agents.
        var chrome = agents.chrome;
        var client = agents.client;
    } catch (error) {
        console.log('Error initializing chrome and CDP client : ' +  String(error));
        return 1;
    }
    
    try {
        // Extract required domains
        const {Network, Page, Debugger, Runtime} = client;

        // Get the Alexa dataset filepath from the properties.
        var filePath = require('./property').urlDataset;

        for (var i = startLine; i <= endLine; i++) {
            var line = await nthline(i, filePath);
            var vals = line.split(",");
            var rank = parseInt(vals[0]);
            var url = vals[1];
            console.log(rank + ' ' + url);
            //await runAndProcessScrappedContents(url, rank, Network, Debugger, Page, Runtime);
        }        

    } catch (error) {
        console.error("Error loading pages and extracting " + String(error));
    } finally {
        if (client) {
            await client.close();
        }
        if (chrome) {
            await chrome.kill();
        }
    }

    return 0;
}

function main() {
    if(cluster.isMaster) {
        var numWorkers = require('os').cpus().length;

        console.log('Master cluster setting up ' + numWorkers + ' workers...');

        // Setup the file access parameters.
        const lineLimit = require('./property').urlLimit;
        const sliceSize = Math.floor(lineLimit/numWorkers);

        // Spin up the workers.
        for(var i = 0; i < numWorkers; i++) {
            var worker = cluster.fork();
            
            var sliceStart = i * sliceSize;
            var sliceEnd = i == numWorkers - 1 ? lineLimit - 1 : sliceStart + sliceSize - 1;

            worker.send({
                startLine: sliceStart,
                endLine: sliceEnd
            });

            worker.on('message', function(message) {
                if (message.type == 'fail') {
                    console.log('Worker ' + worker.process.pid + ' failed, forking a new worker with the same task');
                    var newWorker = cluster.fork();
                    newWorker.send({
                        startLine: message.startLine,
                        endLine: message.endLine
                    });
                }
            });
        }

        cluster.on('online', function(worker) {
            console.log('Worker ' + worker.process.pid + ' is online');
        });

        

        cluster.on('exit', function(worker, code, signal) {
            console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
            // Check if there are no more workers, then gracefully exit the master to close mongoose connections.
            if (Object.keys(cluster.workers).length == 0) {                
                process.exit(0);
            }
        });
    } else {
        process.on('message', async function(message) {        
            var exitCode = await runScrapper(message.startLine, message.endLine);
            // If there was an exit code then we would have to close this one and create a
            // new worker with the same task as this one.
            if (exitCode) {
                process.send({
                    type: 'fail',
                    startLine: message.startLine,
                    endLine: message.endLine
                });
            }
            process.exit(0);
        });
    }
}

// Call the main function.
main();