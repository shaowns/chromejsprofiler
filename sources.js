const CDP = require('chrome-remote-interface');
const chromeLauncher = require('chrome-launcher');

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
 * Process the scrapped contents from the URL.
 * 
 * @param {any} URL 
 * @param {any} scripts 
 * @param {any} requests 
 */
function processUrlContents(URL, scripts, requests) {
    // Dump the script dictionary to console.
    for (var key in scripts) {
        scripts[key].printToConsole();
    }

    // Dump the requests to console.
    for (let r of requests) {
        console.log(r);
    }
}

/**
 * Main function that launches an instance of chrome
 * and retrieves the information from it through the
 * devtools protocol.
 * 
 * @param {String} URL 
 */
var run = async function (URL) {
    try {
        // Wait for chrome to launch
        var chrome = await launchChrome(false);

        // Connect to endpoint
        var client = await CDP({port: chrome.port});

        // Extract required domains
        const {Network, Page, Debugger, Runtime} = client;

        // Container for storing the script objects.
        var scripts = {};

        // Container for request URLs.
        var requests = [];

        // Setup handlers for
        
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
        await Page.navigate({url: URL});
        await Page.loadEventFired();
        const pageContent = await Runtime.evaluate({
            expression: 'document.documentElement.outerHTML'
        }); 
        
        /*
        * Wait for a certain period of time before processing the scripts and the urls.
        * See https://github.com/shaowns/chromejsscrapper/issues/1
        */
        setTimeout(function() {
            processUrlContents(URL, scripts, requests);
        }, 5000);

    } catch (error) {
        console.error(error)
    } finally {
        if (client && chrome) {
            setTimeout(async function() {
                await client.close();
                await chrome.kill();    
            }, 5000);            
        }
    }
}

run('https://google.com');