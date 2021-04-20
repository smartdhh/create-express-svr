module.exports = [
    {
        path: "/", // 访问路径
        // websocket配置
        websocket: {
            sendTemp: "socket1", //所使用的的发送模板
            // 定时发送间隔
            interval: 1000000,
            // 获取发送数据
            getSendData: (message, req) => {
                return { msg: "websocket" };
            },
        },
        // http配置
        http: {
            sendTemp: "success",
            getSendData: (req, res, next) => {
                return { msg: "http" };
            },
        },
    },
    {
        path: "/one", // 访问路径
        // websocket配置
        websocket: {
            sendTemp: "socket1", //所使用的的发送模板
            // 定时发送间隔
            interval: 1000000,
            // 获取发送数据
            getSendData: (message, req) => {
                return { msg: "websocket-one" };
            },
        },
        // http配置
        http: {
            sendTemp: "success",
            getSendData: (req, res, next) => {
                return { msg: "http-one" };
            },
        },
    },
];
