module.exports = {
    success: function (data) {
        return { code: 200, msg: "SUCCESS", body: data };
    },
    relogin: function (data) {
        return { code: 401, msg: "您还未登录" };
    },
    fail: function (msg) {
        return { code: 400, msg: msg };
    },
    socket: function (data) {
        return {
            datetime: 1618678860,
            code: 200,
            data,
        };
    },
};
