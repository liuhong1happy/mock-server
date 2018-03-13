# mock-server

## 安装

npm install --save similar-server-mock-server

## 使用 `mock-start.js`

import 'similar-server-mock-server';

或者

import { Application } from 'similar-server';
import mock = 'similar-server-mock-server/mock';

mock.start(Application());

## 配置文件 `.babelrc`

    {
        "plugins": [
        "transform-decorators-legacy"
        ],
        "presets": ["env"]
    }

## 启动参数  `package.json`

    {
    // ...
    "mockConfig": {
        "mockDir": "mock",
        "serverPort": "9000"
    }
    // ...
    }

## 配置请求 `config.mock.js`

    export default {
        // Support type as Object and Array
        'GET /api/users': { users: [1,2] },
    
        // Method like GET or POST can be omitted
        '/api/users/1': { id: 1 },
    
        // Support for custom functions, the API is the same as express@4
        'POST /api/users/create': (req, res) => { res.end('OK'); },
    };

## 启动

babel-node mock-start.js