const CDP = require('chrome-remote-interface');
const chromeLauncher = require('chrome-launcher');

/**
 * Launches a debugging instance of Chrome.
 * @param {boolean=} headless True (default) launches Chrome in headless mode.
 *     False launches a full version of Chrome.
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

async function run() {
    try {
        // Wait for chrome to launch
        const chrome = await launchChrome();

        // Connect to endpoint
        var client = await CDP({port: chrome.port});

        // Extract required domains
        const {Network, Page, Debugger} = client;

        // Setup handlers for
        
        // request about to be sent.
        /* Network.requestWillBeSent((params) => {
            console.log("-----Begin Request-----");
            console.log("URL: " + params.request.url);
            console.log("-----End Request-----");
        }); */

        // Scripts parsed.
        Debugger.scriptParsed(async (params) => {
            console.log("-----Begin Parsed Script-----");
            console.log("Script ID: " + params.scriptId);
            if (params.url) {
                console.log("URL: " + params.url);
            }
            console.log("Start Line: " + params.startLine);
            console.log("Start Column: " + params.startColumn);
            console.log("End Line: " + params.endLine);
            console.log("End Column: " + params.endColumn);
            console.log("Hash: " + params.hash); // For sanity check later on

            // Fetch the source of the script from the debugger.
            // Retrieve the script source as a promise.
            let source = await Debugger.getScriptSource({scriptId: params.scriptId});
            console.log("-----Begin Script Source-----");
            console.log(source.scriptSource);
            console.log("-----End Script Source-----");
            
            console.log("-----End Parsed Script-----");
        });

        // Scripts failed to parse.
        Debugger.scriptFailedToParse(async (params) => {
            console.log("-----Begin Failed Script-----");
            console.log("Script ID: " + params.scriptId);
            if (params.hasSourceURL) {
                console.log("URL: " + params.url);
            }
            console.log("Start Line: " + params.startLine);
            console.log("Start Column: " + params.startColumn);
            console.log("End Line: " + params.endLine);
            console.log("End Column: " + params.endColumn);
            console.log("Hash: " + params.hash); // For sanity check later on

            // Fetch the source of the script from the debugger.
            // Retrieve the script source as a promise.
            let source = await Debugger.getScriptSource({scriptId: params.scriptId});
            console.log("-----Begin Failed Source-----");
            console.log(source.scriptSource);
            console.log("-----End Failed Source-----");
        
            console.log("-----End Failed Script-----");
        });

        // Enable events, then start.
        await Promise.all([Network.enable(), Page.enable(), Debugger.enable()]);
        await Page.navigate({url: 'http://google.com'});
        await Page.loadEventFired();
    } catch (error) {
        console.error(error)
    } finally {
        if (client) {
            await client.close();
        }
    }
}

run();