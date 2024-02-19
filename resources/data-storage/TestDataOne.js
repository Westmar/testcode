const longString = 'x'.repeat(500);
const variousCharactersString = '><,."`~!\\|}{][_+-=*()&^%@!0123456789a-zA-Z .mp3';

const createLinkData = {
    charactersData: {
        name: variousCharactersString,
        owner: variousCharactersString
    },
    minData: {
        name: '0',
        owner: '0'
    },
    maxData: {
        name: longString,
        owner: longString
    },
    emptyOwner: {
        name: longString
    },
    needProcess: {
        name: variousCharactersString,
        needProcess: true
    },
    noNeedProcess: {
        name: variousCharactersString,
        needProcess: false
    },
    invalidNeedProcess: {
        name: variousCharactersString,
        needProcess: variousCharactersString
    },
};

const getListInvalidData = {
    invalidJsonStart: {
        request: { start: 'a' },
        response: { message: 'Unexpected end of JSON input',
            reason: 'Unexpected end of JSON input',
            result: null,
            type: 'error' }
    },
    emptyJsonStart: {
        request: { start: Buffer.from('{}').toString('base64') },
        response: { message: 'The provided starting key is invalid',
            reason: 'The provided starting key is invalid',
            result: null,
            type: 'error' }
    }
};

const nameError = {
    message: 'Wrong field \'name\'',
    reason: 'Wrong field \'name\'',
    result: null,
    type: 'error'
};
const ownerError = {
    message: 'Wrong field \'owner\'',
    reason: 'Wrong field \'owner\'',
    result: null,
    type: 'error'
};

const createLinkInvalidData = {
    invalidName: {
        request: { start: '/' },
        response: nameError
    },
    emptyName: {
        request: { name: '' },
        response: nameError
    },
    missingName: {
        request: {},
        response: nameError
    },
    invalidOwner: {
        request: { name: 'TEST', owner: '#' },
        response: ownerError
    }
};

module.exports = {
    createLinkData,
    getListInvalidData,
    createLinkInvalidData
};
