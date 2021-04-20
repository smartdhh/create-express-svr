#!/usr/bin/env node
const clone = require("git-clone");
const program = require("commander");
const shell = require("shelljs");
const log = require("tracer").colorConsole();

var VERSION = require("./package").version;

const cliname = "create-express-svr";

program.name(cliname).version(VERSION, "    --version").usage("[dir]").parse(process.argv);

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

    mkdir(dir, "public");
    // copy route templates
    mkdir(dir, "routes");
    copyTemplateMulti("js/routes", dir + "/routes", "*.js");

    // sort dependencies like npm(1)
    pkg.dependencies = sortedObject(pkg.dependencies);

    // write files
    write(path.join(dir, "app.js"), app.render());
    write(path.join(dir, "package.json"), JSON.stringify(pkg, null, 2) + "\n");
    mkdir(dir, "bin");
    write(path.join(dir, "bin/www"), www.render(), MODE_0755);

    var prompt = launchedFromCmd() ? ">" : "$";

    if (dir !== ".") {
        console.log();
        console.log("   change directory:");
        console.log("     %s cd %s", prompt, dir);
    }

    console.log();
    console.log("   install dependencies:");
    console.log("     %s npm install", prompt);
    console.log();
    console.log("   run the app:");

    if (launchedFromCmd()) {
        console.log("     %s SET DEBUG=%s:* & npm start", prompt, name);
    } else {
        console.log("     %s DEBUG=%s:* npm start", prompt, name);
    }

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
