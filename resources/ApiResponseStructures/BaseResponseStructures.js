const createBadRequestError = function(reason = 'Validation error', message) {
    const response = {
        type: 'error',
        reason,
        result: null
    };
    if (message) response.message = message;
    return response;
};

const createInternalServerError = function(reason = 'Internal Server Error') {
    return {
        type: 'error',
        reason,
        result: null,
        code: 'InternalServerError'
    };
};

const createNotFoundError = function(reason = 'Not found') {
    return {
        type: 'error',
        reason,
        result: null
    };
};

const createNotImplementedError = function(reason = 'Not implemented') {
    return {
        type: 'error',
        reason,
        result: null,
        code: 501
    };
};

module.exports = {
    createBadRequestError,
    createInternalServerError,
    createNotFoundError,
    createNotImplementedError
};
