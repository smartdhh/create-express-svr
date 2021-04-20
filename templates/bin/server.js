#!/usr/bin/env node
var { httpApp, wsApp } = require("../app");
var http = require("http");
var https = require("https");
var httpsOptions = {
    key: "",
    cert: "",
};

// 处理端口参数
function normalizePort(val) {
    var port = parseInt(val, 10);
    if (isNaN(port)) {
        return val;
    }
    if (port >= 0) {
        return port;
    }
    return false;
}

// 监听错误
function onError(error) {
    if (error.syscall !== "listen") {
        throw error;
    }
    var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;
    // handle specific listen errors with friendly messages
    switch (error.code) {
        case "EACCES":
            console.error(bind + " requires elevated privileges");
            process.exit(1);
            break;
        case "EADDRINUSE":
            console.error(bind + " is already in use");
            process.exit(1);
            break;
        default:
            throw error;
    }
}

// 监听
function onListening(type, port) {
    console.log(type + " server listening on " + port);
}

var startTypes = process.env.TYPE || "http,https,ws";

var serversConfig = {
    http: {
        portkey: "HTTPPORT",
        portdefault: "3203",
        instance: function () {
            return http.createServer(httpApp);
        },
    },
    https: {
        portkey: "HTTPSPORT",
        portdefault: "3201",
        instance: function () {
            return https.createServer(httpsOptions, httpApp);
        },
    },
    ws: {
        portkey: "WSPORT",
        portdefault: "3204",
        instance: function () {
            return wsApp;
        },
        listening: onListening,
    },
};

startTypes.split(",").forEach(function (key) {
    let serverItem = serversConfig[key];
    if (serverItem) {
        let {
            portkey,
            portdefault,
            instance,
            listening = function (key, port, svr) {
                svr.on("error", onError);
                svr.on("listening", function () {
                    onListening(key, port);
                });
            },
        } = serverItem;
        let port = normalizePort(process.env[portkey] || portdefault);
        let server = instance();
        server.listen(port);
        listening(key, port, server);
    }
});
