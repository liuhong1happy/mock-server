'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.start = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _watch = require('watch');

var _watch2 = _interopRequireDefault(_watch);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _httpProxy = require('http-proxy');

var _httpProxy2 = _interopRequireDefault(_httpProxy);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var parseKey = function parseKey(key) {
    var method = 'get';
    var path = key;

    if (key.indexOf(' ') > -1) {
        var splited = key.split(' ');
        method = splited[0].toLowerCase();
        path = splited[1];
    }

    console.log(method, path);

    return { method: method, path: path };
};

// 获取配置文件
var getConfig = function getConfig() {
    var root_path = process.cwd();
    var tableFile = _path2.default.resolve(root_path, 'config.mock.js');
    var packageJson = require(_path2.default.resolve(root_path, 'package.json'));
    var routeTable = {};
    if (_fs2.default.existsSync(tableFile)) {
        routeTable = require(tableFile).default;
    }

    packageJson.mockConfig = packageJson.mockConfig || {};

    var config = {};
    // 路由配置
    config.routeTable = routeTable;
    // 监听路径
    config.mockDir = _path2.default.resolve(root_path, packageJson.mockConfig.mockDir || 'mock');
    // 监听端口
    config.serverPort = config.serverPort || 9000;
    return config;
};

// 监听文件变化
var watchDir = function watchDir(watch_directory, onChange) {
    _watch2.default.watchTree(watch_directory, function (f, current, previous) {
        if (current == previous) return;
        onChange(getConfig().routeTable);
    });
};

var router = [];

var parseConfig = function parseConfig(config, app) {
    router = [];
    app.routeTable = [];
    var routeTable = config.routeTable;
    Object.keys(routeTable).forEach(function (key) {
        var keyParsed = parseKey(key);
        (0, _assert2.default)(!!keyParsed.method, 'method of ' + key + ' is not valid');
        (0, _assert2.default)(typeof routeTable[key] === 'function' || _typeof(routeTable[key]) === 'object' || typeof routeTable[key] === 'string', 'mock value of ' + key + ' should be function or object or string, but got ' + _typeof(config[key]));

        switch (_typeof(routeTable[key])) {
            case 'string':
                router.push({
                    path: keyParsed.path,
                    method: keyParsed.method,
                    type: 'proxy',
                    value: routeTable[key]
                });
                break;
            case 'object':
                router.push({
                    path: keyParsed.path,
                    method: keyParsed.method,
                    type: 'json',
                    value: routeTable[key]
                });
                break;
            case 'function':
                router.push({
                    path: keyParsed.path,
                    method: keyParsed.method,
                    type: 'handler',
                    value: routeTable[key]
                });
                break;
        }
    });

    router.forEach(function (route) {
        switch (route.type) {
            case 'handler':
                route.hanlder = function (req, res, next) {
                    if (req.method.toLowerCase() !== route.method.toLowerCase()) {
                        route.value(req, res);
                    } else {
                        next();
                    }
                };
                break;
            case 'json':
                route.hanlder = function (req, res, next) {
                    if (req.method.toLowerCase() === route.method.toLowerCase()) {
                        res.setHeader('Content-Type', 'application/json');
                        res.write(JSON.stringify(route.value));
                        res.end();
                    } else {
                        next();
                    }
                };
                break;
            case 'proxy':
                route.hanlder = function (req, res, next) {
                    if (req.method.toLowerCase() === route.method.toLowerCase()) {
                        _httpProxy2.default.web(req, res, {
                            target: route.value
                        });
                    } else {
                        next();
                    }
                };
                break;
        }
        app.route(route.path, route.hanlder);
    });
};

var start = exports.start = function start(app) {
    var config = getConfig();
    // 监听文件夹
    watchDir(config.mockDir, function (_config) {
        return parseConfig(_config, app);
    });
    // 解析配置
    parseConfig(config, app);
    // 开启服务
    app.listen(parseInt(config.serverPort));
};