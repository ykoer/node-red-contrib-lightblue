var fs = require('fs');
module.exports = function(RED) {
    "use strict";

    function LightblueConfig(n) {
        RED.nodes.createNode(this,n);
        this.host = n.host;
        this.lbusetls = n.lbusetls;
        this.options = {};

        if (typeof this.lbusetls === 'undefined'){
            this.lbusetls = false;
        }

        if (this.lbusetls && n.lbtls) {
            var tlsNode = RED.nodes.getNode(n.lbtls);
            if (tlsNode) {
                tlsNode.addTLSOptions(this.options);
            }
        }

    }
    RED.nodes.registerType("lightblue-config",LightblueConfig);
}
