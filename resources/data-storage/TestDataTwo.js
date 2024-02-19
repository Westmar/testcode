const { createBadRequestError } = require('../../resources/ApiResponseStructures/BaseResponseStructures');
const casual = require('casual');
const MAX_FILE_NAME = 'o'.repeat(255);
const MORE_MAX_FILE_NAME = 'q'.repeat(256);
const MAX_CHAT_ID = 's'.repeat(50);
const MORE_MAX_CHAT_ID = 'D'.repeat(51);
const VALID_FILE_NAME = `${Date.now()}_File_With_müssen`;
const CHAT_ID = `${casual._uuid()}`;

const createValidFileName = {
    spacialCharInName: {
        name: '><,."`~!\\|}{][_+-=*()&^%@!'
    },
    validName: {
        name: VALID_FILE_NAME
    },
    cyrillicName: {
        name: 'тест'
    },
    hieroglyphsName: {
        name: 'ヒエログリフ'
    },
    minName: {
        name: 'r'
    },
    maxName:{
        name: MAX_FILE_NAME
    }
};
const getExpectedFilesData = function (userInfo, file, fileId, chatId, date, previewURL, parentId) {
    return {
        created: date.created,
        name: `${VALID_FILE_NAME}.${file.path.split('.').pop()}`,
        owner: userInfo.userWid || userInfo.owner,
        region: userInfo.region || 'eu-central-1',
        size: file.size,
        companyId: userInfo.companyId ,
        chatId: chatId,
        parentId: parentId || '',
        mime: file.mime || 'binary/octet-stream',
        width: file.width,
        height: file.height,
        preview: file.preview || previewURL,
        id: fileId
    };
};
const errNameRequired = '"name" is required';
const errEmptyName = '"name" is not allowed to be empty';
const errStringName = '"name" must be a string';
const errMaxLengthName = '"name" length must be less than or equal to 255 characters long';

const createInvalidFileName = {
    withoutName: {
        request: {},
        response: createBadRequestError(errNameRequired, errNameRequired)
    },
    emptyName: {
        request: { name: '' },
        response: createBadRequestError(errEmptyName, errEmptyName)
    },
    spaceOnlyName: {
        request: { name: ' ' },
        response:  createBadRequestError(errEmptyName, errEmptyName)
    },
    boolName: {
        request: { name: true },
        response: createBadRequestError(errStringName, errStringName)
    },
    numberName: {
        request: { name: 111 },
        response: createBadRequestError(errStringName, errStringName)
    },
    moreThanMaxName: {
        request: { name: MORE_MAX_FILE_NAME },
        response: createBadRequestError(errMaxLengthName, errMaxLengthName)
    }
};
const createValidDestinationChatId = {
    spacialCharInChatId: {
        destinationChatId: '><,."`~!\\|}{][_+-=*()&^%@!'
    },
    validChatId: {
        destinationChatId: '123-With-müssen',
    },
    cyrillicChatId: {
        destinationChatId: 'тест'
    },
    hieroglyphsInChatId: {
        destinationChatId: 'ヒエログリフ'
    },
    minChatId: {
        destinationChatId: '1'
    },
    maxChatId:{
        destinationChatId: MAX_CHAT_ID
    }
};
const errChatIdRequired = '"destinationChatId" is required';
const errEmptyChatId = '"destinationChatId" is not allowed to be empty';
const errStringChatId = '"destinationChatId" must be a string';
const errMaxLengthChatId = '"destinationChatId" length must be less than or equal to 50 characters long';
const createInvaliddDestinationChatId = {
    withoutChatId: {
        request: {},
        response: createBadRequestError(errChatIdRequired, errChatIdRequired)
    },
    emptyChatId: {
        request: { destinationChatId: '' },
        response: createBadRequestError(errEmptyChatId, errEmptyChatId)
    },
    spaceOnlyChatId: {
        request: { destinationChatId: ' ' },
        response: createBadRequestError(errEmptyChatId, errEmptyChatId)
    },
    boolChatId: {
        request: { destinationChatId: true },
        response: createBadRequestError(errStringChatId, errStringChatId)
    },
    numberChatId: {
        request: { destinationChatId: 111 },
        response: createBadRequestError(errStringChatId, errStringChatId)
    },
    moreThanMaxChatId: {
        request: { destinationChatId: MORE_MAX_CHAT_ID },
        response: createBadRequestError(errMaxLengthChatId, errMaxLengthChatId)
    }
};

module.exports = {
    createValidFileName,
    createInvalidFileName,
    createValidDestinationChatId,
    createInvaliddDestinationChatId,
    getExpectedFilesData,
    VALID_FILE_NAME,
    CHAT_ID
};
