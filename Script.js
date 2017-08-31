class Script {

    /**
     * Creates an instance of Script.
     * @param {any} DebuggerScript packed contents of the parameters captured during the
     * triggered event of scriptParsed and scriptFailedToParse.
     * @memberof Script
     */
    constructor(DebuggerScript) {
        this.scriptId = DebuggerScript.scriptId;
        this.url = DebuggerScript.url;
        this.startLine = DebuggerScript.startLine;
        this.startColumn = DebuggerScript.startColumn;
        this.endLine = DebuggerScript.endLine;
        this.endColumn = DebuggerScript.endColumn;
        this.hash = DebuggerScript.hash;

        // This is the script source, we will retrieve this from the debugger.
        // Initialize to an empty string for now.
        this.source = "";
        this.hasSource = false;
    }

    /**
     * Get the script Id
     * 
     * @returns String
     * @memberof Script
     */
    getScriptId() {
        return this._scriptId;
    }

    /**
     * Get the script url
     * 
     * @returns String
     * @memberof Script
     */
    getUrl() {
        return this._url;
    }

    /**
     * Get the starting line of the script
     * 
     * @returns integer
     * @memberof Script
     */
    getStartLine() {
        return this._startLine;
    }

    /**
     * Get the starting column of the script
     * 
     * @returns integer
     * @memberof Script
     */
    getStartColumn() {
        return this._startColumn;
    }

    /**
     * Get the ending line of the script
     * 
     * @returns integer
     * @memberof Script
     */
    getEndLine() {
        return this._endLine;
    }

    /**
     * Get the ending column of the script
     * 
     * @returns integer
     * @memberof Script
     */
    getEndColumn() {
        return this._endColumn;
    }

    /**
     * Get the hash of the script, probably can use for a sanity check later on.
     * 
     * @returns integer
     * @memberof Script
     */
    getHash() {
        return this._hash;
    }

    /**
     * Get the source of the script.
     * 
     * @returns String
     * @memberof Script
     */
    getSource() {
        if (this._hasSource) {
            return this._source;
        }

        // Should not have called.
        throw new Error("Script source is not yet available.");
    }

    /**
     * Check if the script has a source.
     * 
     * @returns boolean
     * @memberof Script
     */
    hasSource() {
        return this._hasSource;
    }

    /**
     * Sets the source of this script.
     * 
     * @param {String} source 
     * @memberof Script
     */
    setSource(source) {
        this._source = source;
        this._hasSource = true;
    }
}