const CDP = require('chrome-remote-interface');

async function run() {
    try {
        // Connect to endpoint
        var client = await CDP();

        // Extract required domains
        const {Network, Page, Debugger} = client;

        // Setup handlers for
        
        // request about to be sent.
        Network.requestWillBeSent((params) => {
            console.log("-----Begin Request-----");
            console.log("URL: " + params.request.url);
            console.log("-----End Request-----");
        });

        // Scripts parsed.
        Debugger.scriptParsed((params) => {
            console.log("-----Begin Parsed Script-----");
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
            console.log("-----Begin Script Source-----");

            // Retrieve the script source as a promise.
            let source = Debugger.getScriptSource({scriptId: params.scriptId});
            source.then(function(result) {
                console.log(result);
            });
            console.log("-----End Script Source-----");

            console.log("-----End Parsed Script-----");
        });

        // Scripts failed to parse.
        Debugger.scriptFailedToParse((params) => {
            console.log("-----Begin Parsed Script-----");
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
            console.log("-----Begin Script Source-----");

            // Retrieve the script source as a promise.
            let source = Debugger.getScriptSource({scriptId: params.scriptId});
            source.then(function(result) {
                console.log(result);
            });
            console.log("-----End Script Source-----");

            console.log("-----End Parsed Script-----");
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