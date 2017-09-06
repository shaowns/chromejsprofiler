const CDP = require('chrome-remote-interface');
const chromeLauncher = require('chrome-launcher');
const delay = require('delay');

// Imported class.
var Script = require('./Script.js');

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
 * @param {String} url 
 * @param {Dictionary} scripts 
 * @param {Array} requests 
 * @param {String} finalHtml
 */
function processUrlContents(url, scripts, requests, finalHtml) {
    // Dump the script dictionary to console.
    for (var key in scripts) {
        console.log(JSON.stringify(scripts[key]));
    }

    // Dump the requests to console.
    for (let r of requests) {
        console.log(r);
    }

    //console.log(finalHtml);
}

/**
 * Takes a string and scrapes off the sources, requests, and the
 * final page content from the given url.
 * 
 * @param {String} url 
 * @param {any} Network 
 * @param {any} Debugger 
 * @param {any} Page 
 * @param {any} Runtime 
 * @returns Object packed with the source scripts, requests, and the final page content.
 */
async function scrape(url, Network, Debugger, Page, Runtime) {
    // Container for storing the script objects.
    var scripts = {};
    
    // Container for request URLs.
    var requests = [];

    // Setup handlers for: 
    // request about to be sent.
    Network.requestWillBeSent((params) => {
        requests.push(params.request.url);
    });

    // Scripts parsed.
    Debugger.scriptParsed(async (params) => {
        var s = new Script(params, false);

        // Fetch the source of the script from the debugger.
        // Retrieve the script source as a promise.
        let source = await Debugger.getScriptSource({scriptId: s.getScriptId()});
        s.setSource(source.scriptSource);
        scripts[s.getScriptId()] = s;
    });

    // Scripts failed to parse.
    Debugger.scriptFailedToParse(async (params) => {
        var s = new Script(params, true);

        // Fetch the source of the script from the debugger.
        // Retrieve the script source as a promise.
        let source = await Debugger.getScriptSource({scriptId: s.getScriptId()});
        s.setSource(source.scriptSource);
        scripts[s.getScriptId()] = s;
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

    return {requests: requests, scripts: scripts, finalHtml: finalPageContent.result.value};
}

/**
 * Initiate the scrapping of sources and process the retrieved contents.
 * 
 * @param {String} url 
 * @param {any} Network 
 * @param {any} Debugger 
 * @param {any} Page 
 * @param {any} Runtime 
 */
async function runAndProcessScrappedContents(url, Network, Debugger, Page, Runtime) {
    // Get the scraped contents from the url given.
    let contents = await scrape(url, Network, Debugger, Page, Runtime);
    
    // Process the contents we just scraped.
    let scripts = contents.scripts;
    let requests = contents.requests;
    let finalHtml = contents.finalHtml;
    
    processUrlContents(url, scripts, requests, finalHtml);
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
        await runAndProcessScrappedContents('http://google.com', Network, Debugger, Page, Runtime);
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