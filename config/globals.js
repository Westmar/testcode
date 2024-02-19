global.chai = require('chai');
global.chaiHttp = require('chai-http');
global.chaiJsonSchema = require('chai-json-schema');
global.chaiExclude = require('chai-exclude');
global.assert = global.chai.assert;

global.jwtDecode = require('jwt-decode');

global.chai.use(global.chaiHttp);
global.chai.use(global.chaiJsonSchema);
global.chai.use(global.chaiExclude);
global.chai.tv4.multiple = true;
global.chai.config.truncateThreshold = 0;

global.cloneObject = obj => JSON.parse(JSON.stringify(obj));
