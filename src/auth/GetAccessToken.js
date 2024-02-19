const { getPersonalToken } = require('../*/GetPersonalToken');
const AuthRequest = require('./AuthRequest');
const serviceAccessTokenJSON = {
    type: 'object',
    required: ['type', 'result'],
    properties: {
        type: {
            type: 'string'
        },
        result: {
            type: 'object',
            required: ['accessToken', 'refreshToken'],
            additionalProperties: false,
            properties: {
                accessToken: {
                    type: 'string'
                },
                refreshToken: {
                    type: 'string'
                }
            }
        }
    }
};
const getAuthAccessTokenV2 = async props => {
    const authRequest = new AuthRequest(props, [await getPersonalToken(props)]);
    let accessToken = await authRequest.getAccessTokenV2();
    match.success(accessToken, serviceAccessTokenJSON);
    accessToken = accessToken.body.result.accessToken;
    let decodeAccessToken = global.jwtDecode(accessToken);
    assert.equal(decodeAccessToken.iss, (props.authUrl.match(/^https:\/\/(.*?)\/$/))[1]);
    assert.equal(decodeAccessToken.sub, 'accessToken');
    assert.equal(decodeAccessToken.aud, (props.authUrl.match(/^https:\/\/(.*?)\/$/))[1]);
    return accessToken;
};

module.exports = {
    getAuthAccessTokenV2
};


