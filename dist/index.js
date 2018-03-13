'use strict';

var _similarServer = require('similar-server');

var _mock = require('./mock');

// 创建Application
var app = (0, _similarServer.Application)();

(0, _mock.start)(app);