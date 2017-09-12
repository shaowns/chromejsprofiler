class Script {

    /**
     * Creates an instance of Script.
     * @param {any} DebuggerScript packed contents of the parameters captured during the
     * triggered event of scriptParsed and scriptFailedToParse.
     * @param {boolean} isFailedScript determines if this is failed to parse script.
     * @memberof Script
     */
    constructor(DebuggerScript, isFailedScript) {
        this.scriptId = DebuggerScript.scriptId;
        this.url = DebuggerScript.url;
        this.startLine = DebuggerScript.startLine;
        this.startColumn = DebuggerScript.startColumn;
        this.endLine = DebuggerScript.endLine;
        this.endColumn = DebuggerScript.endColumn;
        this.hash = DebuggerScript.hash;
        this.failedToParse = isFailedScript;         
        this.source = "";        
    }

    /**
     * Get the script Id
     * 
     * @returns String
     * @memberof Script
     */
    getScriptId() {
        return this.scriptId;
    }

    /**
     * Get the script url
     * 
     * @returns String
     * @memberof Script
     */
    getUrl() {
        return this.url;
    }

    /**
     * Get the starting line of the script
     * 
     * @returns integer
     * @memberof Script
     */
    getStartLine() {
        return this.startLine;
    }

    /**
     * Get the starting column of the script
     * 
     * @returns integer
     * @memberof Script
     */
    getStartColumn() {
        return this.startColumn;
    }

    /**
     * Get the ending line of the script
     * 
     * @returns integer
     * @memberof Script
     */
    getEndLine() {
        return this.endLine;
    }

    /**
     * Get the ending column of the script
     * 
     * @returns integer
     * @memberof Script
     */
    getEndColumn() {
        return this.endColumn;
    }

    /**
     * Get the hash of the script, probably can use for a sanity check later on.
     * 
     * @returns integer
     * @memberof Script
     */
    getHash() {
        return this.hash;
    }

    /**
     * Get the source of the script.
     * 
     * @returns String
     * @memberof Script
     */
    getSource() {
        return this.source;        
    }

    /**
     * Sets the source of this script.
     * 
     * @param {String} s 
     * @memberof Script
     */
    setSource(source) {
        this.source = source;
    }

    /**
     * Check if this is a failed to parse type script.
     * 
     * @returns boolean
     * @memberof Script
     */
    isFailedScript() {
        return this.failedToParse;
    }

    /**
     * Dumps the script class contents on the console for debugging purposes.
     * 
     * @memberof Script
     */
    printToConsole() {
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
        console.log(this.getSource());
        console.log("-----End Script Source-----");
    
        console.log("-----End Script-----");
    }
}

module.exports = Script;