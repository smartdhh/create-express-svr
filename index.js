#!/usr/bin/env node
const program = require("commander");
var VERSION = require("./package").version;
var TEMPLATE_DIR = path.join(__dirname, "..", "templates");
const CLINAME = "create-express-svr";

program.name(CLINAME).version(VERSION, "    --version").usage("[dir]").parse(process.argv);

main();

function main() {
    // Path
    var destinationPath = program.args.shift() || ".";

    // App name
    var appName = createAppName(path.resolve(destinationPath)) || "hello-world";

    // Generate application
    emptyDirectory(destinationPath, function (empty) {
        if (empty || program.force) {
            createApplication(appName, destinationPath);
        } else {
            confirm("destination is not empty, continue? [y/N] ", function (ok) {
                if (ok) {
                    process.stdin.destroy();
                    createApplication(appName, destinationPath);
                } else {
                    console.error("aborting");
                    exit(1);
                }
            });
        }
    });
}

function createApplication(name, dir) {
    console.log();

    // package数据
    var pkg = {
        name: name,
        version: VERSION,
        scripts: {
            start: "cross-env TYPE=http nodemon ./bin/server.js",
            all: "nodemon ./bin/server.js",
            ws: "cross-env TYPE=ws nodemon ./bin/server.js",
            https: "cross-env TYPE=https nodemon ./bin/server.js",
        },
        dependencies: {
            "cookie-parser": "~1.4.3",
            express: "^4.16.3",
            "express-ws": "^3.0.0",
            cors: "^2.8.4",
            morgan: "~1.9.0",
        },
        devDependencies: {
            "cross-env": "^7.0.3",
            nodemon: "^1.17.4",
        },
    };

    if (dir !== ".") {
        mkdir(dir, ".");
    }

    // 拷贝所需要的文件
    ["app.js"].forEach(function (key) {
        copyTemplate(key, path.join(dir, "public/" + key));
    });

    // 创建文件夹并拷贝文件
    [("bin", "core", "pulbic", "routes", "routes/path")].forEach(function (key) {
        mkdir(dir, key);
        copyTemplateMulti(key, dir + "/" + key, "*.js");
    });

    // 创建package.json文件
    write(path.join(dir, "package.json"), JSON.stringify(pkg, null, 4) + "\n");
    console.log();
}

function createAppName(pathName) {
    return path
        .basename(pathName)
        .replace(/[^A-Za-z0-9.-]+/g, "-")
        .replace(/^[-_.]+|-+$/g, "")
        .toLowerCase();
}

function emptyDirectory(dir, fn) {
    fs.readdir(dir, function (err, files) {
        if (err && err.code !== "ENOENT") throw err;
        fn(!files || !files.length);
    });
}

function copyTemplate(from, to) {
    write(to, fs.readFileSync(path.join(TEMPLATE_DIR, from), "utf-8"));
}

function copyTemplateMulti(fromDir, toDir, nameGlob) {
    fs.readdirSync(path.join(TEMPLATE_DIR, fromDir))
        .filter(minimatch.filter(nameGlob, { matchBase: true }))
        .forEach(function (name) {
            copyTemplate(path.join(fromDir, name), path.join(toDir, name));
        });
}

function mkdir(base, dir) {
    var loc = path.join(base, dir);
    console.log("   \x1b[36mcreate\x1b[0m : " + loc + path.sep);
    mkdirp.sync(loc, MODE_0755);
}
