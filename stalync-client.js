var basicDataType = [ "string", "number", "boolean" ];

class Client {
    /**
     * Put your stalync credentials for specific application
     * the credentials located in stalync profile page.
     * @param {string} developerID
     * @param {string} applicationName
     */
    constructor(developerID, applicationName) {

        /** @private */
        this.developerID = developerID;
        /** @private */
        this.applicationName = applicationName;

        /** @private */
        this.eventMap = {};
        /** @private */
        this.allEventCallback;

        /** 
         * @private
         * @type {WebSocket}
         */
        this.websocketClient;
    }

    connect() {
        let URL = `ws://ws.stalync.tech?developerID=${this.developerID}&applicationName=${this.applicationName}`;
        if ('WebSocket' in window) {
            this.websocketClient = new WebSocket(URL);
        } else if ('MozWebSocket' in window) {
            this.websocketClient = new MozWebSocket(URL);
        } else if(typeof require === "function") {
            let WS = require('websocket').w3cwebsocket;
            this.websocketClient = new WS(URL);
        } else {
            this.websocketClient = new SockJS(URL);
        }

        /**
         * @param {string} eventName 
         * @param {string=} value 
         */
        let callUserCallback = (eventName, value) => { 
            if(eventName == "*") {
                if(this.allEventCallback) this.allEventCallback(value);
            } else {
                let currentCallback = this.eventMap[eventName];
                if(currentCallback) currentCallback(eventName, value);
            }
        };

        this.websocketClient.onclose = (_) => { callUserCallback("$disconnected") };
        this.websocketClient.onerror = (_) => { callUserCallback("$error") };
        this.websocketClient.onopen  = (_) => { callUserCallback("$connected") };
        this.websocketClient.onmessage = (event) => { 
            let payload = JSON.parse(event.data);
            callUserCallback(payload.eventName, payload.message);
        }
    }

    /**
     * @param {string} eventName
     * @param {string | number | boolean | Object} message 
     */
    emitEvent(eventName, message) {
        if(typeof eventName !== "string") {
            return console.error("Error event name expected to be a string in function emitEvent");
        }

        /** @type {string} */
        let convertedMessage;

        if(basicDataType.indexOf(typeof message) >= 0) {
            convertedMessage = String(message);
        } else if(!message) {
            convertedMessage = "";
        } else {
            convertedMessage = JSON.stringify(message);
        }

        this.websocketClient.send(
            JSON.stringify({
                message: convertedMessage,
                eventName,
            })
        );
    }

    /**
     * @param {string} eventName 
     * @param {function(string)} callback 
     */
    onEvent(eventName, callback) {
        if(typeof eventName !== "string") {
            return console.error("Error event name expected to be a string in function onEvent");
        }

        if(typeof callback !== "function") {
            return console.error("Error callback expected to be a function with one string parameter");
        }

        this.eventMap[eventName] = callback;
    }

    /**
     * @param {function(string)} callback 
     */
    onMessage(callback) {
        if(typeof callback !== "function") {
            return console.error("Error callback expected to be a function with one string parameter");
        }

        this.allEventCallback = callback;
    }
}

if(typeof module === "object") {
    module.exports = { Client };
}
