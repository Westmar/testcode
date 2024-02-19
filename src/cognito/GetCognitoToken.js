const BaseApi = require('../BaseApi');

class GetCognitoToken extends BaseApi {
    constructor(props, auth) {
        super();
        this.props = props;
        this.request = chai.request(props.loginUri);
        this.auth = auth;
        this.redirectUri = props.redirectUri;
        this.tokenUrl = props.tokenUrl;
    }

    getAccessToken(ClientId, refreshToken) {
        const params = {
            'grant_type': 'refresh_token',
            'client_id': ClientId,
            'redirect_uri': this.redirectUri,
            'refresh_token': refreshToken,
        };
        let formBody = [];
        // eslint-disable-next-line guard-for-in
        for (let property in params) {
            formBody.push(`${encodeURIComponent(property)}=${encodeURIComponent(params[property])}`);
        }
        formBody = formBody.join('&');
        const request = this.request
            .post(this.tokenUrl)
            .set('content-type', 'application/x-www-form-urlencoded')
            .send(formBody);
        GetCognitoToken.addDefaultMiddlewares(request);
        return GetCognitoToken.chooseAuth(request, this.auth);
    }
}

module.exports = GetCognitoToken;
