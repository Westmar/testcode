const ssh = require('../lib/ExecOnSSH');
const allowedContentTypes = [
    'application/json; charset=utf-8',
    'text/html; charset=utf-8',
    'application/json'
];
const accessErrorMessages = [
    'Access error',
    'Forbidden',
    'Permission denied'
];
global.match = {
    success: function (response, scheme) {
        assert.equal(response.status, 200, `Response status is not 200. Response is not correct: ${response.text}`);
        assert.oneOf(response.header['content-type'], allowedContentTypes, `Content type is not application/json. Response: ${response.text}`);
        if (scheme) {
            assert.jsonSchema(response.body, scheme, `JSON schema is not valid. Response: ${response.text}`);
        }
        return response;
    },
    warn: function (response, expected) {
        assert.equal(response.status, 200, `Response status is not 200. Response is not correct: ${response.text}`);
        assert.oneOf(response.header['content-type'], allowedContentTypes, `Content type is not application/json. Response: ${response.text}`);
        assert.equal(response.body.type, 'warning', `Response type is not result. Response: ${response.text}`);
        if (expected) {
            assert.deepEqual(response.body, expected, `Response JSON is not valid. Response: ${response.text}`);
        }
        return response;
    },
    badRequest: function (response, expected) {
        assert.equal(response.status, 400, `Response status is not 400. Response is not correct: ${response.text}`);
        assert.oneOf(response.header['content-type'], allowedContentTypes, `Content type is not application/json. Response: ${response.text}`);
        if (expected) {
            assert.deepEqual(response.body, expected, `Response JSON is not valid. Response: ${response.text}`);
        }
        return response;
    },
    unauthorized: function (response) {
        assert.equal(response.status, 401, `Response status is not 401. Response is not correct: ${response.text}`);
        assert.equal(response.body.result, null, `Response is not correct - ${response.text}`);
        assert.equal(response.body.reason || response.body.message || response.body.error.message, 'Unauthorized', `reason is not correct - ${response.text}`);
        assert.oneOf(response.header['content-type'], allowedContentTypes, `Content type is not application/json. Response: ${response.text}`);
        return response;
    },
    accessError: function(response) {
        assert.equal(response.status, 403, `Response status is not 403. Response is not correct: ${response.text}`);
        assert.equal(response.body.result, null, `Response is not correct - ${response.text}`);
        assert.oneOf(response.body.reason || response.body.message, accessErrorMessages, `reason is not correct - ${response.text}`);
        assert.oneOf(response.header['content-type'], allowedContentTypes, `Content type is not application/json. Response: ${response.text}`);
        return response;
    },
    notFound: function (response) {
        assert.equal(response.status, 404, `Response status is not 404. Response is not correct: ${response.text}`);
        assert.equal(response.body.result, null, `Response is not correct - ${response.text}`);
        assert.oneOf(response.header['content-type'], allowedContentTypes, `Content type is not application/json. Response: ${response.text}`);
        return response;
    },
    notAllowed: function (response) {
        assert.equal(response.status, 405, `Response status is not 405. Response is not correct: ${response.text}`);
        assert.equal(response.body.result, null, `Response is not correct - ${response.text}`);
        assert.equal(response.header['content-type'], 'text/html', `Content type is not text/html. Response: ${response.text}`);
        return response;
    },
    internalServerError: function (response, expected) {
        assert.equal(response.status, 500, `Response status is not 500. Response is not correct: ${response.text}`);
        assert.equal(response.body.result, null, `Response is not correct - ${response.text}`);
        assert.oneOf(response.header['content-type'], allowedContentTypes, `Content type is not application/json. Response: ${response.text}`);
        if (expected) {
            assert.deepEqual(response.body, expected, `Response JSON is not valid. Response: ${response.text}`);
        }
        return response;
    },
    serviceUnavailable: function (response, expected) {
        assert.equal(response.status, 503, `Response status is not 503. Response is not correct: ${response.text}`);
        assert.equal(response.body.result, null, `Response is not correct - ${response.text}`);
        assert.oneOf(response.header['content-type'], allowedContentTypes, `Content type is not application/json. Response: ${response.text}`);
        if (expected) {
            assert.deepEqual(response.body, expected, `Response JSON is not valid. Response: ${response.text}`);
        }
        return response;
    },
    unprocessableEntity: function (response, expected) {
        assert.equal(response.status, 422, `Response status is not 422. Response is not correct: ${response.text}`);
        assert.oneOf(response.header['content-type'], allowedContentTypes, `Content type is not application/json. Response: ${response.text}`);
        if (expected) {
            assert.deepEqual(response.body, expected, `Unexpected JSON response. Response: ${response.text}`);
        }
        return response;
    },
    found: function (response, expectedLocation) {
        assert.equal(response.status, 302, `Response status is not 302. Response is not correct: ${response.text}`);
        if (expectedLocation) {
            assert.deepEqual(response.headers.location, expectedLocation, `Unexpected redirect location. Response: ${response.text}`);
        }
        return response;
    },
    sshOutput: async function (command, sshEnv, expected,) {
        const text = await ssh(command, sshEnv);
        if (expected) {
            assert.equal(text, expected);
        }
        return text;
    }
};
