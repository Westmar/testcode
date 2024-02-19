const testData = require('../../resources/data-storage/TestDataTwo');
const { VALID_FILE_NAME, CHAT_ID, getExpectedFilesData } = require('../../resources/data-storage/TestDataTwo');
const dataStorageSchemas = require('../../resources/ApiResponseStructures/DataStorageBStruct');
const md5 = require('md5');
const testFiles = require('../../resources/data-storage/testFiles');
const s3Requests = require('../../src/s3/*');
const casual = require('casual');
const { getAuthAccessTokenV2 } = require('../../src/auth/GetAccessToken');
const GetCognitoToken = require('../../src/cognito/GetCognitoToken');
const { DataStorageRequests } = require('../../src/data-storage/DataStorageRequests');
const AuthRequest = require('../../src/auth/AuthRequest');
const { prepare } = require('../../src/*/EnvCustom');
const readFileToBuffer = require('../../lib/ReadFileToBuffer');
const fluentWait = require('../../lib/FluentWait');

const cognitoData = global.cfg.launchEnvironment.services.test.server;
const props = {
    authUrl: global.cfg.launchEnvironment.services.auth,
    dataStorageUrl: global.cfg.launchEnvironment.services['data-storage'],
    serial: global.cfg.launchEnvironment.services.test.serial,
    domainName: global.cfg.launchEnvironment.services.test.domainName,
    url: global.cfg.launchEnvironment.services.test.url,
    username: global.cfg.launchEnvironment.services.test.adminUsername,
    password: global.cfg.launchEnvironment.services.test.adminPassword,
};
const createDataStorageBaseURL = (global.cfg.launchEnvironment.services['data-storage']).replace(/.*.com\//g, '');
const dataStorageAud = (global.cfg.launchEnvironment.services['data-storage']).slice(0, -1);

const FLUENT_WAIT_TIMEOUT = 10000;
const CUSTOM_TIMEOUT_STEP = 1000;

const getAuthTokenDataForConversation = function (aud, scope) {
    return {
        aud: aud || dataStorageAud,
        scope: scope || 'post get b'
    };
};
const checkDownloadedFiles = async function (link, expectedFileData) {
    const downloadFileResponse = await s3Requests.downloadFileFromS3(link);
    assert.equal(downloadFileResponse.statusCode, 200);
    assert.equal(downloadFileResponse.headers['content-length'], expectedFileData.size);
    assert.equal(downloadFileResponse.headers['content-type'], (expectedFileData.mime || 'binary/octet-stream'));

    const fileDataBuffer = await readFileToBuffer(expectedFileData.path);
    const expectedFileDatas = fileDataBuffer.toString('utf-8');
    if (downloadFileResponse.text) {
        return assert.deepEqual(downloadFileResponse.text, expectedFileDatas);
    }
    return assert.deepEqual(downloadFileResponse.body, fileDataBuffer);
};
const getFileNameWithExtension = function (filePath) {
    return `${VALID_FILE_NAME}.${filePath.split('.').pop()}`;
};
const getPresignedLinkAndUploadFile = async function (request, chatId, fileData) {
    const createLinkResponse = match.success(await request.postCreatePresignedURL(chatId, { name: getFileNameWithExtension(fileData.path) }), dataStorageSchemas.presignedLink);
    const fileId = createLinkResponse.body.result.id;
    const uploadFileURL = createLinkResponse.body.result.path;
    const uploadFileResponse = await s3Requests.uploadFileToS3(uploadFileURL, fileData.path, fileData.mime);
    assert.equal(uploadFileResponse.statusCode, 200);
    await fluentWait(async function () {
        const { status } = await request.getFileInfoInConversation(chatId, fileId);
        return status === 200;
    }, FLUENT_WAIT_TIMEOUT, CUSTOM_TIMEOUT_STEP);
    return fileId;
};
const uploadAndForwardFile = async function (requestForUpload, requestForForward, chatId, fileData, newChatID) {
    const fileId = await getPresignedLinkAndUploadFile(requestForUpload, chatId, fileData);
    match.success(await requestForUpload.getFileInfoInConversation(chatId, fileId), dataStorageSchemas.responseInfo);

    const forwardingFileResponse = match.success(await requestForForward.postForwardFileInConversation(chatId, fileId, { destinationChatId: newChatID.destinationChatId }), dataStorageSchemas.responseInfo);
    return forwardingFileResponse.body.result;
};
describe('Check data-storage conversation API', function () {
    let authUserInfo, guestUserInfo, dataStorageConversationRequest, guestUserDataStorageConversationRequest;
    before('Prepare , prepare auth and data-storage services requests, get userInfo', async function () {
        await prepare();
        const authAccessToken = await getAuthAccessTokenV2(props);
        const authRequestsAccessToken = new AuthRequest(props, [authAccessToken]);
        const getDataStorageTokenResponse = match.success(await authRequestsAccessToken
            .createOpenIdServiceToken(getAuthTokenDataForConversation()));
        dataStorageConversationRequest = new DataStorageRequests(props, [getDataStorageTokenResponse.body.result.id_token]);
        const decodedToken = global.jwtDecode(getDataStorageTokenResponse.body.result.id_token);
        authUserInfo = {
            userWid: decodedToken['auth:wid'],
            region: decodedToken['auth:awsRegion'],
            companyId: decodedToken['auth:companyId']
        };

        //Get authorization for user with cognito token to connect to Data Storage for send file in conversation
        const getCognitoToken = new GetCognitoToken(cognitoData);
        const cognitoTokenResponse = await getCognitoToken.getAccessToken(cognitoData.ClientId, cognitoData.refresh_token);
        const authRequestsAccessCognitoToken = new AuthRequest(props, [cognitoTokenResponse.body.id_token]);
        const getDataStorageTokenWithCognitoResponse = match.success(await authRequestsAccessCognitoToken
            .createOpenIdServiceToken(getAuthTokenDataForConversation()));
        guestUserDataStorageConversationRequest = new DataStorageRequests(props, [getDataStorageTokenWithCognitoResponse.body.result.id_token]);
        const decodedUserToken = global.jwtDecode(getDataStorageTokenWithCognitoResponse.body.result.id_token);
        guestUserInfo = {
            owner: decodedUserToken['auth:wid'],
            companyId: decodedUserToken['auth:companyId']
        };
    });
    describe(`Checking POST request to /api/v1/conversation/${CHAT_ID}`, function () {
        for (const [dataSetName, data] of Object.entries(testData.createValidFileName)) {
            it(`Check creating correct upload file link when send POST request to /api/v1/conversation/${CHAT_ID} with valid data: ${dataSetName}`, async function () {
                const createLinkResult = match.success(await dataStorageConversationRequest
                    .postCreatePresignedURL(CHAT_ID, data), dataStorageSchemas.presignedLink);
                const fileId = createLinkResult.body.result.id;
                const expectedPartialPath = `/${authUserInfo.companyId}/conversations/${CHAT_ID}/${md5(fileId)}`;
                assert.include((createLinkResult.body.result.path), expectedPartialPath);
            });
        }
    });
    describe(`Checking GET request to /api/v1/conversation/${CHAT_ID} with various file type`, function () {
        for (const [fileType, data] of Object.entries((testFiles.filesForConversations))) {
            it(`Check info about ${fileType} file via GET request to /api/v1/conversation/${CHAT_ID}`, async function () {
                const fileId = await getPresignedLinkAndUploadFile(dataStorageConversationRequest, CHAT_ID, data);

                const previewURL = `${createDataStorageBaseURL}-${authUserInfo.region}.s3.${authUserInfo.region}.amazonaws.com/${authUserInfo.companyId}/conversations/${CHAT_ID}/${md5(fileId)}_thumbnail`;

                const getFileInfoResponse = match.success(await dataStorageConversationRequest
                    .getFileInfoInConversation(CHAT_ID, fileId), dataStorageSchemas.responseInfo);
                const receivedFilesData = getFileInfoResponse.body.result;

                const expectedData = getExpectedFilesData(authUserInfo, data, fileId, CHAT_ID, receivedFilesData, previewURL);
                assert.deepEqual(receivedFilesData, expectedData);
            });

            it(`Check thumbnail for ${fileType} file via GET request to /api/v1/conversation/${CHAT_ID}`, async function () {
                const fileId = await getPresignedLinkAndUploadFile(dataStorageConversationRequest, CHAT_ID, data);

                const expectedResultForPreview = await readFileToBuffer(data.thumbnail);

                const getFileInfoResponse = match.success(await dataStorageConversationRequest
                    .getFileInfoInConversation(CHAT_ID, fileId), dataStorageSchemas.responseInfo);
                const receivedFilesData = getFileInfoResponse.body.result;

                const downloadPreviewResponse = await s3Requests.downloadFileFromS3(receivedFilesData.preview);
                assert.deepEqual(downloadPreviewResponse.body, expectedResultForPreview);
            });
        }
    });
    describe(`Checking GET request to /api/v1/conversation/${CHAT_ID}/{{FILEID}}/download file from data storage service`, function () {
        for (const [fileType, data] of Object.entries(testFiles.filesForConversations)) {
            it(`Downloads correct file when sending GET request to /api/v1/conversation/${CHAT_ID}/{{FILEID}}/download with different file types: ${fileType}`, async function () {
                const fileId = await getPresignedLinkAndUploadFile(dataStorageConversationRequest, CHAT_ID, data);

                match.success(await dataStorageConversationRequest.getFileInfoInConversation(CHAT_ID, fileId), dataStorageSchemas.responseInfo);

                const getDownloadLinkResponse = await dataStorageConversationRequest.getDownloadLinkInConversation(CHAT_ID, fileId);
                const getDownloadLink = getDownloadLinkResponse.headers.location;
                await checkDownloadedFiles(getDownloadLink, data);
            });
        }
        for (const [dataSetName, data] of Object.entries(testData.createValidFileName)) {
            it(`200 OK is returned and correct file is downloaded if send GET request to /api/v1/conversation/${CHAT_ID}/{{FILEID}}/download with different file name: ${dataSetName}`, async function () {
                const createLinkResult = match.success(await dataStorageConversationRequest
                    .postCreatePresignedURL(CHAT_ID, data), dataStorageSchemas.presignedLink);
                const fileId = createLinkResult.body.result.id;

                const uploadFileURL = createLinkResult.body.result.path;
                const uploadFileResponse = await s3Requests.uploadFileToS3(uploadFileURL, testFiles.filesForConversations.pdf.path, testFiles.filesForConversations.pdf.mime);
                assert.equal(uploadFileResponse.statusCode, 200);

                match.success(await dataStorageConversationRequest.getFileInfoInConversation(CHAT_ID, fileId), dataStorageSchemas.responseInfo);

                const getDownloadLinkResponse = await dataStorageConversationRequest.getDownloadLinkInConversation(CHAT_ID, fileId);
                const getDownloadLink = getDownloadLinkResponse.headers.location;
                await checkDownloadedFiles(getDownloadLink, testFiles.filesForConversations.pdf);
            });
        }
    });
    for (const [dataSetName, data] of Object.entries(testData.createValidDestinationChatId)) {
        it(`Checking POST request to /api/v1/conversation/${CHAT_ID}/{{FILEID}}/forward file from ${CHAT_ID} to another chat with ${dataSetName}`, async function () {
            const forwardData = await uploadAndForwardFile(dataStorageConversationRequest, dataStorageConversationRequest, CHAT_ID, testFiles.filesForConversations.csv, data);
            const previewURL = `${createDataStorageBaseURL}-${authUserInfo.region}.s3.${authUserInfo.region}.amazonaws.com/${authUserInfo.companyId}/conversations/${CHAT_ID}/${md5(forwardData.id)}_thumbnail`;

            const expectedData = getExpectedFilesData(authUserInfo, testFiles.filesForConversations.csv, forwardData.id, data.destinationChatId, forwardData, previewURL, forwardData.parentId);
            assert.deepEqual(forwardData, expectedData);
        });
    }
    describe('Check availability of a file by a guest user (user with other companyID) ', function () {
        it(`Correct data is returned on GET request to /api/v1/conversation/${CHAT_ID}/{{FILEID}} if executed by a guest user`, async function () {
            const fileId = await getPresignedLinkAndUploadFile(dataStorageConversationRequest, CHAT_ID, testFiles.filesForConversations.csv);

            const previewURL = `${createDataStorageBaseURL}-${authUserInfo.region}.s3.${authUserInfo.region}.amazonaws.com/${authUserInfo.companyId}/conversations/${CHAT_ID}/${md5(fileId)}_thumbnail`;

            const getFileInfoResponse = match.success(await guestUserDataStorageConversationRequest.getFileInfoInConversation(CHAT_ID, fileId), dataStorageSchemas.responseInfo);
            const receivedFilesData = getFileInfoResponse.body.result;

            const expectedData = getExpectedFilesData(authUserInfo, testFiles.filesForConversations.csv, fileId, CHAT_ID, receivedFilesData, previewURL);
            assert.deepEqual(receivedFilesData, expectedData);
        });
        it(`Correct data is returned on POST request to /api/v1/conversation/${CHAT_ID}/{{FILEID}}/forward file from ${CHAT_ID} to another chat if executed by a guest user`, async function () {
            const forwardData = await uploadAndForwardFile(dataStorageConversationRequest, guestUserDataStorageConversationRequest, CHAT_ID, testFiles.filesForConversations.csv, testData.createValidDestinationChatId.validChatId);
            const previewURL = `${createDataStorageBaseURL}-${authUserInfo.region}.s3.${authUserInfo.region}.amazonaws.com/${authUserInfo.companyId}/conversations/${CHAT_ID}/${md5(forwardData.id)}_thumbnail`;

            const expectedData = getExpectedFilesData(guestUserInfo, testFiles.filesForConversations.csv, forwardData.id, testData.createValidDestinationChatId.validChatId.destinationChatId, forwardData, previewURL, forwardData.parentId);
            assert.deepEqual(forwardData, expectedData);
        });
    });
    describe('Check negative tests in API data storage for conversation', function () {
        const nonexistentFileId = casual.name;
        it(`404 Not Found returned if send GET request to /api/v1/conversation/${CHAT_ID}/{{FILEID}} about nonexistent file`, async function () {
            match.notFound(await dataStorageConversationRequest.getFileInfoInConversation(CHAT_ID, nonexistentFileId));
        });
        it(`404 Not Found returned if send POST request to /api/v1/conversation/${CHAT_ID}/{{FILEID}}/forward with nonexistent file`, async function () {
            match.notFound(await dataStorageConversationRequest.postForwardFileInConversation(CHAT_ID, nonexistentFileId, { destinationChatId: 'TestFile' }));
        });
        it(`404 Not Found returned if send GET request to /api/v1/conversation/${CHAT_ID}/{{FILEID}}/download and try download nonexistent file`, async function () {
            match.notFound(await dataStorageConversationRequest.getDownloadLinkInConversation(CHAT_ID, nonexistentFileId));
        });
        for (const [dataSetName, data] of Object.entries(testData.createInvalidFileName)) {
            it(`Server returns 400 Bad Request when send GET request to /api/v1/conversation/${CHAT_ID}/{{FILEID}} with invalid data: ${dataSetName}`, async function () {
                const createLinkResult = await dataStorageConversationRequest.postCreatePresignedURL(CHAT_ID, data.request);
                match.badRequest(createLinkResult, data.response);
            });
        }
        for (const [dataSetName, data] of Object.entries(testData.createInvaliddDestinationChatId)) {
            it(`Server returns 400 Bad Request when send POST request to /api/v1/conversation/${CHAT_ID}/{{FILEID}}/forward with invalid data: ${dataSetName}`, async function () {
                const fileId = await getPresignedLinkAndUploadFile(dataStorageConversationRequest, CHAT_ID, testFiles.filesForConversations.csv);

                const forwardingFileResponse = await dataStorageConversationRequest.postForwardFileInConversation(CHAT_ID, fileId, data.request);
                match.badRequest(forwardingFileResponse, data.response);
            });
        }
    });
    describe('S3 returns 403 Forbidden for all conversations requests without valid tokens', function () {
        it('S3 returns 403 Forbidden for GET file request without valid tokens in path', async function () {
            const fileId = await getPresignedLinkAndUploadFile(dataStorageConversationRequest, CHAT_ID, testFiles.filesForConversations.doc);

            const getDownloadLinkResponse = await dataStorageConversationRequest.getDownloadLinkInConversation(CHAT_ID, fileId);
            const getDownloadLink = getDownloadLinkResponse.headers.location;
            const urlWithoutTokens = getDownloadLink.split('?').shift();

            const downloadFileResponse = await s3Requests.downloadFileFromS3(urlWithoutTokens);
            assert.equal(downloadFileResponse.statusCode, 403);
        });
        it('S3 returns 403 Forbidden for PUT file request without valid tokens in path', async function () {
            const createLinkReponse = await dataStorageConversationRequest.postCreatePresignedURL(CHAT_ID, { name: VALID_FILE_NAME });
            const urlWithoutTokens = createLinkReponse.body.result.path.split('?').shift();

            const s3Response = await s3Requests.uploadFileToS3(urlWithoutTokens, testFiles.filesForConversations.csv.path);
            assert.equal(s3Response.statusCode, 403);
        });
    });
});
describe('Check access to data-storage conversation API with old Fileshare aud', function () {
    it(`200 OK is returned if send POST request to /api/v1/conversation/${CHAT_ID} with 'fileshare' aud`, async function () {
        const authAccessToken = await getAuthAccessTokenV2(props);
        const authRequestsAccessToken = new AuthRequest(props, [authAccessToken]);
        const getDataStorageTokenWithOldAUDResponse = match.success(await authRequestsAccessToken
            .createOpenIdServiceToken(getAuthTokenDataForConversation('fileshare')));
        const dataStorageConversationWithOldAUDRequest = new DataStorageRequests(props, [getDataStorageTokenWithOldAUDResponse.body.result.id_token]);

        match.success(await dataStorageConversationWithOldAUDRequest.postCreatePresignedURL(CHAT_ID, { name: getFileNameWithExtension(testFiles.filesForConversations.csv.path) }), dataStorageSchemas.presignedLink);
    });
});
