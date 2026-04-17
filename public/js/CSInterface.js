/**
 * CSInterface.js - Adobe CEP Bridge
 * Simplified mock for development and template structure.
 */

function CSInterface() {
    this.evalScript = function(script, callback) {
        if (window.__adobe_cep__) {
            window.__adobe_cep__.evalScript(script, callback);
        } else {
            console.log("Mock EvalScript:", script);
            if (callback) callback("Mock Result");
        }
    };

    this.getSystemPath = function(pathType) {
        return "/mock/path/to/adobe";
    };

    this.addEventListener = function(type, listener) {
        console.log("Mock AddEventListener:", type);
    };
}

if (typeof module !== 'undefined') {
    module.exports = CSInterface;
} else {
    window.CSInterface = CSInterface;
}
