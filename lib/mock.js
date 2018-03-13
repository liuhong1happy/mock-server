import path from 'path'
import assert from 'assert';
import httpProxy from 'http-proxy'
import fs from 'fs'

const parseKey = (key)  =>{
    let method = 'get';
    let path = key;

    if (key.indexOf(' ') > -1) {
        const splited = key.split(' ');
        method = splited[0].toLowerCase();
        path = splited[1];
    }

    console.log(method, path);

    return { method, path };
}

// 获取配置文件
const getConfig = ()=> {
    let root_path = process.cwd();
    let tableFile = path.resolve(root_path, 'config.mock.js');
    let packageJson = require(path.resolve(root_path, 'package.json'));
    let routeTable = {}
    if (fs.existsSync(tableFile)) {
        routeTable = require(tableFile).default
    }

    packageJson.mockConfig = packageJson.mockConfig || {};

    let config = {};
    // 路由配置
    config.routeTable = routeTable;
    // 监听端口
    config.serverPort = packageJson.mockConfig.serverPort || 9000;
    return config;
}

let router = [];

const parseConfig = (config, app)=> {
    router = [];
    app.routeTable = [];
    const routeTable = config.routeTable;
    Object.keys(routeTable).forEach(key => {
        const keyParsed = parseKey(key);
        assert(!!keyParsed.method, `method of ${key} is not valid`);
        assert(
            typeof routeTable[key] === 'function' ||
            typeof routeTable[key] === 'object' ||
            typeof routeTable[key] === 'string',
            `mock value of ${key} should be function or object or string, but got ${typeof config[key]}`,
        );

        switch(typeof routeTable[key]) {
            case 'string':
                router.push({
                    path: keyParsed.path,
                    method: keyParsed.method,
                    type: 'proxy',
                    value: routeTable[key]
                })
                break;
            case 'object':
                router.push({
                    path: keyParsed.path,
                    method: keyParsed.method,
                    type: 'json',
                    value: routeTable[key]
                })
                break;
            case 'function':
                router.push({
                    path: keyParsed.path,
                    method: keyParsed.method,
                    type: 'handler',
                    value: routeTable[key]
                })
                break;
        }
    });

    router.forEach((route)=>{
        switch(route.type) {
            case 'handler':
                route.hanlder = (req,res, next)=>{
                    if(req.method.toLowerCase() === route.method.toLowerCase()) {
                        route.value(req, res);
                    } else {
                        next();
                    }
                };
                break;
            case 'json':
                route.hanlder = (req, res, next)=>{
                    if(req.method.toLowerCase() === route.method.toLowerCase()) {
                        res.setHeader('Content-Type', 'application/json');
                        res.write(JSON.stringify(route.value));
                        res.end();
                    } else {
                        next();
                    }
                };
                break;
            case 'proxy':
                route.hanlder = (req, res, next)=>{
                    if(req.method.toLowerCase() === route.method.toLowerCase()) {
                        httpProxy.web(req, res, {
                            target: route.value
                        })
                    } else {
                        next();
                    }
                };
                break;
        }
        app.route(route.path, route.hanlder);
    })
}

export const start = (app)=> {
    let config = getConfig();
    // 解析配置
    parseConfig(config, app);
    // 开启服务
    app.listen(parseInt(config.serverPort));
}