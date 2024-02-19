const BaseApi = require('../BaseApi');
AuthRequest.__proto__ = BaseApi;

function AuthRequest(props, auth) {
    this.props = props;
    this.request = chai.request(props.authUrl);
    this.auth = auth;
    this.serviceAccessToken = 'api/v2/Token/';
    this.serviceTokenFS = 'api/v1/Token/FileStorage';
    this.serviceToken = 'api/v2/Token/';
    this.usersMeV2 = 'api/v2/users/me';
    this.usersMeV1 = 'api/v1/users/me';
    this.logOut = 'api/v1/logout';
    this.openIdServiceTokenPath = 'api/v2/OpenId/service/';
}

AuthRequest.prototype = {
    getAccessTokenV2: function () {
        const request = this.request.get(this.serviceAccessToken);
        AuthRequest.addDefaultMiddlewares(request);
        return AuthRequest.chooseAuth(request, this.auth);
    },
    getAccessTokenFS: function () {
        const request = this.request.get(this.serviceTokenFS);
        AuthRequest.addDefaultMiddlewares(request);
        return AuthRequest.chooseAuth(request, this.auth);
    },
    getServiceToken: function (service) {
        const request = this.request.get(this.serviceToken + service);
        AuthRequest.addDefaultMiddlewares(request);
        return AuthRequest.chooseAuth(request, this.auth);
    },
    getUsersMeV2: function (service) {
        const request = this.request.get(this.usersMeV2)
            .set({ 'X-APP-NAME': service });
        AuthRequest.addDefaultMiddlewares(request);
        return AuthRequest.chooseAuth(request, this.auth);
    },
    getUsersMeV1: function () {
        const request = this.request.get(this.usersMeV1);
        AuthRequest.addDefaultMiddlewares(request);
        return AuthRequest.chooseAuth(request, this.auth);
    },
    createOpenIdServiceToken: function (data) {
        const request = this.request
            .post(this.openIdServiceTokenPath)
            .send(data);
        AuthRequest.addDefaultMiddlewares(request);
        return AuthRequest.chooseAuth(request, this.auth);
    },
    logout: function () {
        const request = this.request.post(this.logOut);
        AuthRequest.addDefaultMiddlewares(request);
        return AuthRequest.chooseAuth(request, this.auth);
    },
    optionsAccessTokenV2: function (headers) {
        const request = this.request.options(this.serviceAccessToken)
            .set(headers);
        return AuthRequest.addDefaultMiddlewares(request);
    },
    optionsAccessTokenFS: function (headers) {
        const request = this.request.options(this.serviceTokenFS)
            .set(headers);
        return AuthRequest.addDefaultMiddlewares(request);
    },
    optionsServiceToken: function (headers, service) {
        const request = this.request.options(this.serviceToken + service)
            .set(headers);
        return AuthRequest.addDefaultMiddlewares(request);
    }
};

module.exports = AuthRequest;
