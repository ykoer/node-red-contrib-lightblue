var https = require('https');
var url = require('url');
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

    function LightblueSimpleClient(config) {
        RED.nodes.createNode(this,config);
        this.collection = config.collection;
        this.query = config.query;
        this.projection = config.projection;
        this.sort = config.sort;
        this.from = config.from;
        this.to = config.to;

        // Retrieve the config node
        this.lightblueconfig = RED.nodes.getNode(config.lightblueconfig);

        var node = this;

        //var options = url.parse("https://lightbluedatasvc.dev0.a1.vary.redhat.com/rest/data/find/containerProduct?from=0&to=0")
        var options = url.parse(this.lightblueconfig.host);
        options.cert = this.lightblueconfig.options.cert;
        options.key = this.lightblueconfig.options.key;

        this.on('input', function(msg) {
            if (!node.collection) {
                if (msg.collection) {
                    node.collection = msg.collection;
                } else {
                    node.error("lightblue collection is required", msg);
                    return;
                }
            }
            if (msg.query) {
                node.query = msg.query;
            }
            if (msg.projection) {
                node.projection = msg.projection;
            }
            if (msg.sort) {
                node.sort = msg.sort;
            }
            if (msg.from) {
                node.from = msg.from;
            }
            if (msg.to) {
                node.to = msg.to;
            }

            var queryString = "";
            if (isNotEmpty(node.query)) {
                queryString += "Q="+node.query;
            }
            if (isNotEmpty(node.projection)) {
                queryString += (queryString.length>0 ? "&":"");
                queryString += "P="+node.projection;
            }
            if (isNotEmpty(node.sort)) {
                queryString += (queryString.length>0 ? "&":"");
                queryString += "S="+node.sort;
            }
            if (isNotEmpty(node.from)) {
                queryString += (queryString.length>0 ? "&":"");
                queryString += "from="+node.from;
            }
            if (isNotEmpty(node.to)) {
                queryString += (queryString.length>0 ? "&":"");
                queryString += "to="+node.to;
            }

            options.path = "/rest/data/find/" + node.collection + "?" + queryString;
            options.parseprocessed = config.parseprocessed;;

            var req = https.request(options, function(res) {
                res.on('data', function(data) {
                    if (res.statusCode==200) {
                        try {
                            msg.payload = JSON.parse(data.toString());
                            if (options.parseprocessed) {
                                msg.payload = JSON.parse(data.toString()).processed;
                            } else {
                                msg.payload = JSON.parse(data.toString());
                            }
                            node.send(msg);
                        } catch(e) {
                            node.error("lightblue error occured", msg);
                        }
                    }
                });
            });

            req.end();
        });
    }
    RED.nodes.registerType("lightblue-simple-client",LightblueSimpleClient);

    function LightblueComplexClient(config) {
        RED.nodes.createNode(this,config);
        this.collection = config.collection;
        this.operation = config.operation;

        // Retrieve the config node
        this.lightblueconfig = RED.nodes.getNode(config.lightblueconfig);

        var node = this;

        //var options = url.parse("https://lightbluedatasvc.dev0.a1.vary.redhat.com/rest/data/find/containerProduct?from=0&to=0")
        var options = url.parse(this.lightblueconfig.host);
        options.cert = this.lightblueconfig.options.cert;
        options.key = this.lightblueconfig.options.key;
        options.method = 'POST';

        this.on('input', function(msg) {
            if (!node.collection) {
                if (msg.collection) {
                    node.collection = msg.collection;
                } else {
                    node.error("lightblue collection is required", msg);
                    return;
                }
            }
            if (!node.operation) {
                if (msg.operation) {
                    node.operation = msg.operation;
                } else {
                    node.error("lightblue operation is required", msg);
                    return;
                }
            }

            if (msg.query) {
                try {
                    node.query = msg.query;
                } catch(e) {
                    node.error("Fooo", msg);
                }
                
            }

            options.path = "/rest/data/" + node.operation + "/" + node.collection;
            options.parseprocessed = config.parseprocessed;



            var req = https.request(options, function(res) {
                res.on('data', function(data) {
                    if (res.statusCode==200) {
                        try {
                            msg.payload = JSON.parse(data.toString());
                            if (options.parseprocessed) {
                                msg.payload = JSON.parse(data.toString()).processed;
                            } else {
                                msg.payload = JSON.parse(data.toString());
                            }
                            node.send(msg);
                        } catch(e) {
                            node.error("lightblue error occured", msg);
                        }
                    }
                });
            });

            if (node.query) {
                if (typeof node.query === "string") {
                    req.write(node.query);
                } else {
                    req.write(JSON.stringify(node.query));                    
                }
            } 
            req.end();
        });
    }
    RED.nodes.registerType("lightblue-complex-client", LightblueComplexClient);

    function isNotEmpty (val) {
            return val !== undefined && val !== '';
    }
}

