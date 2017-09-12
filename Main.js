const CDP = require('chrome-remote-interface');
const chromeLauncher = require('chrome-launcher');
const delay = require('delay');

// Mongoose models
var DB = require('./DB');
var Script = require("./Script").model;
var ScrappedContent = require('./ScrappedContent');

/**
 * Launches a debugging instance of Chrome.
 * 
 * @param {boolean=} headless True (default) launches Chrome in headless mode.
 * False launches a full version of Chrome.
 * @return {Promise<ChromeLauncher>}
 */
function launchChrome(headless=true) {
  return chromeLauncher.launch({
    port: 9222,
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
    // Dump the script dictionary to console.
    for (let s of content.scripts) {
        s.dumpToConsole();
    }

    // Dump the requests to console.
    for (let r of content.requests) {
        console.log(r);
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
    
    // Container for request URLs.
    var requests = [];

    // Setup handlers for: 
    // request about to be sent.
    Network.requestWillBeSent((params) => {
        requests.push(params.request.url);
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
    await Page.navigate({url: url});
    await Page.loadEventFired();
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
 */
var run = async function () {
    try {        
        var agents = await init();

        // Expand into the required agents.
        var chrome = agents.chrome;
        var client = agents.client;

        // Extract required domains
        const {Network, Page, Debugger, Runtime} = client;

        // TODO: Do the following for multithread or multi process way.
        await runAndProcessScrappedContents('http://google.com', 1, Network, Debugger, Page, Runtime);
    } catch (error) {
        console.error(error)
    } finally {
        if (client && chrome) {
            
            await client.close();
            await chrome.kill();

        }
    }
}

run();