const httpLogger = require('../lib/HTTPLogger');
function BaseApi() {
}

BaseApi.addDefaultMiddlewares = function(request) {
    return request.use(httpLogger);
};

BaseApi.chooseAuth = function (request, auth) {
    if (!auth) {
        return request;
    } else if (auth[1]) {
        return request
            .auth(auth[0], auth[1]);
    } else {
        return request
            .auth(auth[0], { type: 'bearer' });
    }
};

module.exports = BaseApi;
