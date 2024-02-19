let envType = process.env.ENV_TYPE;
const { getAuthAccessTokenV2 } = require('./GetAccessToken');
const AuthRequest = require('./AuthRequest');
const serviceTokenJSON = {
    type: 'object',
    required: ['type', 'result'],
    properties: {
        type: {
            type: 'string'
        },
        result: {
            type: 'object',
            required: ['token'],
            additionalProperties: false,
            properties: {
                token: {
                    type: 'string'
                }
            }
        }
    }
};
let server = null;
const getServiceTokenV1 = async props => {
    switch (envType) {
        case 'prod':
            server = '*';
            break;
        default:
            server = '*';
            break;
    }
    const getServiceAccessTokenRes = await chai.request(server)
        .get('auth/token?*');
    match.success(getServiceAccessTokenRes, serviceTokenJSON);

    const authRequest = new AuthRequest(props, [getServiceAccessTokenRes.body.result.token]);
    const accessTokenFS = await authRequest.getAccessTokenFS();
    match.success(accessTokenFS);

    const token = accessTokenFS.body.result.token;
    const decodeToken = global.jwtDecode(token);

    assert.equal(decodeToken.iss, (props.authUrl.match(/^https:\/\/(.*?)\/$/))[1]);
    assert.equal(decodeToken.aud, 'FileStorage');
    return token;

};
const getServiceTokenV2 = async (props, service) => {
    const authRequest = new AuthRequest(props, [await getAuthAccessTokenV2(props)]);
    const serviceToken = await authRequest.getServiceToken(service);
    match.success(serviceToken, serviceTokenJSON);
    const token = serviceToken.body.result.token;
    return token;
};

module.exports = {
    getServiceTokenV1,
    getServiceTokenV2
};


