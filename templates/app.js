var express = require("express");
var wsExpress = require("express-ws");
var path = require("path");
var fs = require("fs");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
// 输出模板
var respTemp = require("./data/response");
// 返回配置的http和websocket对象
var routerConfig = {};

// 使用fs读取routes中的路由，递归获取路由配置
var routesPath = path.join(__dirname, "routes");

// http对象
var httpApp = express();
// websocket对象
var wsApp = express();
wsExpress(wsApp);

(function getRouterData(parentPath) {
    let files = fs.readdirSync(parentPath);
    files.forEach((fileName) => {
        var filePath = path.join(parentPath, fileName);
        var file = fs.statSync(filePath);
        if (!file.isDirectory()) {
            var tempCurrentRouter = parentPath.replace(routesPath, "") + "/" + fileName.substr(0, fileName.length - 3);
            routerConfig[tempCurrentRouter] = require("./routes/" + tempCurrentRouter);
        } else {
            getRouterData(filePath);
        }
    });
})(routesPath);

// 允许跨域
httpApp.use(
    cors({
        origin: function (origin, callback) {
            callback(null, true);
        },
        credentials: true,
    })
);
// view engine setup
httpApp.use(logger("dev"));
httpApp.use(cookieParser());
httpApp.use("/public", express.static("public"));

// 将需要发送的数据转成string
function transferSendToString(sendTemp, originData) {
    return JSON.stringify(respTemp[sendTemp](originData));
}

// 遍历router配置数据
Object.keys(routerConfig).map((routerID) => {
    routerConfig[routerID].forEach(({ path, http, websocket }) => {
        let routerPath = (routerID + path).replace(/\\/g, "/");
        // 如果http存在
        if (http) {
            let { sendTemp = "success", getSendData } = http;
            httpApp.all(routerPath, function (req, res, next) {
                res.send(respTemp[sendTemp](getSendData(req, res, next)));
            });
        }
        if (websocket) {
            let { interval = 5000, sendTemp = "success", getSendData } = websocket;
            // 如果不存在
            if (!getSendData) {
                sendTemp = "fail";
                getSendData = () => routerPath + "未配置数据";
            }
            wsApp.ws(routerPath, (ws, req) => {
                // 默认发送的数据
                let defaultSendString = transferSendToString(sendTemp, getSendData(undefined, req));
                // 需要发送的数据
                ws.send(defaultSendString);
                let intervalID = setInterval(function () {
                    ws.send(defaultSendString);
                }, interval);
                // 关闭后清除发送
                ws.on("close", () => {
                    clearInterval(intervalID);
                });
                // 接收参数后执行
                ws.on("message", function (msg) {
                    ws.send(transferSendToString(sendTemp, getSendData(msg, req)));
                });
            });
        }
    });
});

// catch 404 and forward to error handler
httpApp.use(function (req, res, next) {
    //next(createError(404));
    res.send(respTemp.fail("请求的地址[" + req.originalUrl + "]不存在！"));
});

// error handler
httpApp.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};
    // render the error page
    res.status(err.status || 500);
    res.render("error");
});

module.exports = {
    wsApp,
    httpApp,
};
