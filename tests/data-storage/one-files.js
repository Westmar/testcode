const AuthRequests = require('../../src/auth/AuthRequest');
const { DataStorageRequests, REQUEST_TYPES } = require('../../src/data-storage/DataStorageRequests');
const s3Requests = require('../../src/s3/S3s');
const { prepare, getKey } = require('../../src/*');
const readFileToBuffer = require('../../lib/ReadFileToBuffer');
const fluentWait = require('../../lib/FluentWait');
const dataStorageSchemas = require('../../resources/ApiResponseStructures/DataStorageStruct');
const testFiles = require('../../resources/data-storage/testFiles/index');
const testData = require('../../resources/data-storage/TestDataOne');
const { sleep } = require('../../lib/Utils');
const md5 = require('md5');

const CUSTOM_TIMEOUT = 50000;
const FLUENT_WAIT_TIMEOUT = 10000;
const CUSTOM_TIMEOUT_STEP = 1000;
const EVENT_WAIT_TIME = 2000;
const PAGINATION_BIG_COUNT = { count: 1000 };
const PAGINATION_MIN_COUNT = { count: 1 };
const DEFAULT_PAGINATION_COUNT = 15;
const REQUIRED_UPLOAD_ITERATIONS = 4;
const DEFAULT_OWNER = 'system';
const ORDER_DIRS = [
    'DESC',
    'ASC'
];
const DEFAULT_TEST_OWNER = 'admin';

const props = {
    authUrl: global.cfg.launchEnvironment.services.auth,
    dataStorageUrl: global.cfg.launchEnvironment.services['data-storage'],
    serial: global.cfg.launchEnvironment.services.test.serial,
    domainName: global.cfg.launchEnvironment.services.test.domainName
};

const getAuthTokenData = function (scope, aud) {
    return {
        aud: aud || 'fileshare',
        scope: scope || 'post get delete'
    };
};

const uploadFileByNewLink = async function (requests, requestType, fileData) {
    const linkData = {
        name: fileData.name,
        owner: fileData.owner || DEFAULT_TEST_OWNER
    };
    const createLinkResponse = match.success(await requests.postCreateLink(requestType, linkData), dataStorageSchemas.link);

    const uploadFileURL = createLinkResponse.body.path;
    const uploadFileResponse = await s3Requests.uploadFileToS3(uploadFileURL, fileData.path);
    assert.equal(uploadFileResponse.statusCode, 200);
    return uploadFileResponse;
};

const waitForFileUploaded = async function(requests, requestType, fileData) {
    await fluentWait(async function () {
        const filesList = await requests.getListOfFiles(requestType, { count: 1, order: 'DESC' });
        return filesList.body.items.includes(fileData.name);
    }, FLUENT_WAIT_TIMEOUT, CUSTOM_TIMEOUT_STEP);
};

const getDownloadUrl = async function (requests, requestType, fileName) {
    const attemptGetLinkResponse = await requests.getDownloadLink(requestType, fileName);
    return attemptGetLinkResponse.headers.location;
};

const getLinkAndDownloadFile = async function (requests, requestType, fileName) {
    const downloadFileURL = await fluentWait(getDownloadUrl.bind(this, requests, requestType, fileName));
    const downloadFileResponse = await s3Requests.downloadFileFromS3(downloadFileURL);
    assert.equal(downloadFileResponse.statusCode, 200);
    return downloadFileResponse;
};

const generateFileName = function (filePath) {
    let fileExtension = filePath.split('.').pop();
    return `${Date.now()}.${fileExtension}`;
};

const generateTestFileData = function (customFileData) {
    const fileData = customFileData || testFiles.files.mp3;
    const fileName = generateFileName(fileData.path);
    return { ...fileData, name: fileName };
};

const uploadTestFiles = async function (dataStorageRequests, requestType) {
    let createdFiles = [];
    for (const fileData of Object.values(testFiles.files)) {
        const fileName = generateFileName(fileData.path);
        await uploadFileByNewLink(dataStorageRequests, requestType, { ...fileData, name: fileName });
        createdFiles.push(fileName);
        await sleep();
    }
    await fluentWait(async function () {
        const filesList = await dataStorageRequests.getListOfFiles(requestType, { count: createdFiles.length, order:'DESC' });
        if (filesList.body.items.length<createdFiles.length) return false;
        for (const file of filesList.body.items) {
            if (!createdFiles.includes(file.name)) return false;
        }
        return true;
    }, FLUENT_WAIT_TIMEOUT, CUSTOM_TIMEOUT_STEP);
    return createdFiles;
};

const clearAllFiles = async function (requests, requestType) {
    await sleep(EVENT_WAIT_TIME);
    const fileListResponse = match.success(await requests.getListOfFiles(requestType, PAGINATION_BIG_COUNT));
    const fileList = fileListResponse.body.items || [];
    for (const fileData of fileList) {
        match.success(await requests.deleteFile(requestType, fileData.name));
    }
    await sleep(EVENT_WAIT_TIME);
};

describe('Check Data Storage Service REST API', function () {
    let authRequests, dataStorageRequests, info;
    before('Prepare , get  serial, prepare auth and data-storage services requests, get info', async function () {
        await prepare();
        const key = await getKey();

        const authServiceAuth = [props.serial, key];
        authRequests = new AuthRequests(props, authServiceAuth);

        const tokenData = getAuthTokenData();
        const serviceTokenResponse = match.success(await authRequests.createOpenIdServiceToken(tokenData));
        const idToken = serviceTokenResponse.body.result.id_token;
        let decodedToken = global.jwtDecode(idToken);
        info = {
            region: decodedToken['auth:awsRegion'],
            companyId: decodedToken['auth:companyId']
        };
        dataStorageRequests = new DataStorageRequests(props, [idToken]);
    });
    after('Remove created files form data-storage service', function () {
        this.timeout(CUSTOM_TIMEOUT);
        for (const requestType of Object.keys(REQUEST_TYPES)) {
            return clearAllFiles(dataStorageRequests, requestType);
        }
    });
    for (const requestType of Object.keys(REQUEST_TYPES)) {
        // eslint-disable-next-line no-loop-func
        describe(`Check file listing in the data storage service - ${requestType}`, function () {
            before('Clear all existing files', async function () {
                this.timeout(CUSTOM_TIMEOUT);
                await clearAllFiles(dataStorageRequests, requestType);
            });
            it(`Empty array is returned if there are no files in ${requestType} list`, async function () {
                const listResponse = match.success(await dataStorageRequests.getListOfFiles(requestType), dataStorageSchemas.list);
                assert.isEmpty(listResponse.body.items);
            });
            it(`File list is updated in ${requestType} path when files are uploaded`, async function () {
                const listBeforeResponse = await dataStorageRequests.getListOfFiles(requestType, PAGINATION_BIG_COUNT);
                let fullList = listBeforeResponse.body.items;

                const createdFilesNames = await uploadTestFiles(dataStorageRequests, requestType);

                const newListResponse = match.success(await dataStorageRequests.getListOfFiles(requestType, PAGINATION_BIG_COUNT), dataStorageSchemas.list);
                const addedFilesRecords = newListResponse.body.items.filter(file => createdFilesNames.includes(file.name));
                fullList.push(...addedFilesRecords);
                assert.sameDeepMembers(newListResponse.body.items, fullList);
            });
            describe(`Check order parameter in ${requestType} listing`, function () {
                before('Clear existing files', async function () {
                    this.timeout(CUSTOM_TIMEOUT);
                    await clearAllFiles(dataStorageRequests, requestType);
                    await uploadTestFiles(dataStorageRequests, requestType);
                });
                const testItemsSorting = async function (sortOrder = null) {
                    let requestParam = sortOrder ? { order: sortOrder } : null;
                    let sortSign = sortOrder === 'ASC' ? 1 : -1;

                    const listResponse = match.success(await dataStorageRequests.getListOfFiles(requestType, requestParam), dataStorageSchemas.list);
                    const sortedResponse = [...listResponse.body.items].sort((a, b) => (a.created - b.created) * sortSign);
                    assert.sameDeepOrderedMembers(listResponse.body.items, sortedResponse);
                };
                for (const order of ORDER_DIRS) {
                    it(`Items in result array are sorted by created time with ${order} order when provided in ${requestType} endpoint`, testItemsSorting.bind(this, order));
                }
                it(`Items in result array are sorted by created time with DESC order by default in ${requestType} endpoint`, testItemsSorting);
                it(`Items in result array are sorted by created time with DESC order if invalid order is provided in ${requestType} endpoint`, testItemsSorting.bind(this, 'TEST'));
            });
            describe(`Check contents of fileData in ${requestType} listing`, function () {
                before('Clear existing files', async function () {
                    this.timeout(CUSTOM_TIMEOUT);
                    await clearAllFiles(dataStorageRequests, requestType);
                });
                it(`Check actual items in files list array (fields and their values) in ${requestType} endpoint`, async function () {
                    const createdFilesNames = await uploadTestFiles(dataStorageRequests, requestType);
                    const testFilesArr = Object.values(testFiles.files);

                    const listResponse = match.success(await dataStorageRequests.getListOfFiles(requestType, { order: 'ASC' }), dataStorageSchemas.list);
                    const receivedFilesData = listResponse.body.items;

                    const expectedFilesData = testFilesArr.map((testFileData, index) => ({
                        created: receivedFilesData[index].created,
                        region: info.region || '',
                        companyId: info.companyId,
                        serial: props.serial,
                        domain: props.domainName,
                        owner: DEFAULT_TEST_OWNER,
                        size: testFileData.size,
                        name: createdFilesNames[index],
                    }));
                    assert.sameDeepOrderedMembers(receivedFilesData, expectedFilesData);
                });
            });
            describe(`Check pagination in ${requestType} files list`, function () {
                const generateNextPageLink = function (params = {}) {
                    let resultLink = `/${dataStorageRequests[REQUEST_TYPES[requestType]]}`;
                    const paramsArr = Object.entries(params).map(([name, value]) => `${name}=${value}`);
                    if (paramsArr.length > 0) resultLink += `?${paramsArr.join('&')}`;
                    return resultLink;
                };
                before('Clear existing files, create 15+ test files', async function () {
                    this.timeout(CUSTOM_TIMEOUT * 2);
                    await clearAllFiles(dataStorageRequests, requestType);
                    for (let i = 0; i < REQUIRED_UPLOAD_ITERATIONS; i++) {
                        await uploadTestFiles(dataStorageRequests, requestType);
                    }
                });
                const testPaginationWithOrder = async function (order) {
                    const allFilesResponse = match.success(await dataStorageRequests.getListOfFiles(requestType, { ...PAGINATION_BIG_COUNT, order: order }));
                    const allFilesArr = allFilesResponse.body.items;

                    const firstPageResponse = match.success(await dataStorageRequests.getListOfFiles(requestType, { ...PAGINATION_MIN_COUNT, order: order }), dataStorageSchemas.list);
                    let combinedArr = firstPageResponse.body.items;
                    let nextPageLink = firstPageResponse.body.nextPage;
                    while (nextPageLink && nextPageLink.includes('start')) {
                        const linkQuery = nextPageLink.split('?').pop();
                        const nextPageResponse = match.success(await dataStorageRequests.getListOfFiles(requestType, linkQuery), dataStorageSchemas.list);

                        if (nextPageResponse.body.items.length === 0) break;

                        combinedArr.push(...nextPageResponse.body.items);
                        nextPageLink = nextPageResponse.body.nextPage;
                    }
                    assert.sameDeepOrderedMembers(combinedArr, allFilesArr);
                };
                for (const order of ORDER_DIRS) {
                    it(`All records can be collected by following the next page link in ${requestType} list with ${order} order`, testPaginationWithOrder.bind(this, order));
                }
                it(`Only ${DEFAULT_PAGINATION_COUNT} items are returned by default in ${requestType} list`, async function () {
                    const listResponse = match.success(await dataStorageRequests.getListOfFiles(requestType), dataStorageSchemas.list);
                    assert.equal(listResponse.body.items.length, DEFAULT_PAGINATION_COUNT);
                    assert.include(listResponse.body.nextPage, 'start');
                });
                it(`All items are returned if count parameter contains invalid value in ${requestType} list`, async function () {
                    const invalidCountResponse = match.success(await dataStorageRequests.getListOfFiles(requestType, { count: 'test' }), dataStorageSchemas.list);
                    assert.equal(invalidCountResponse.body.items.length, DEFAULT_PAGINATION_COUNT);
                    assert.include(invalidCountResponse.body.nextPage, 'start');
                });
                it(`${DEFAULT_PAGINATION_COUNT} items are returned if send zero count parameter in ${requestType} path`, async function () {
                    const listResponse = match.success(await dataStorageRequests.getListOfFiles(requestType, { count: 0 }), dataStorageSchemas.list);
                    assert.equal(listResponse.body.items.length, DEFAULT_PAGINATION_COUNT);
                    assert.include(listResponse.body.nextPage, 'start');
                });
                it(`NextPage path contains start parameter with base64 string from last file in response if there are more elements in ${requestType} list`, async function () {
                    const listResponse = match.success(await dataStorageRequests.getListOfFiles(requestType, PAGINATION_MIN_COUNT), dataStorageSchemas.list);
                    const lastFileInResponse = listResponse.body.items.pop();

                    const startValueRaw = JSON.stringify({ name: lastFileInResponse.name, created: lastFileInResponse.created * 1000 });
                    const startValueBase64 = Buffer.from(startValueRaw).toString('base64');

                    const expectedLink = generateNextPageLink({ ...PAGINATION_MIN_COUNT, start: startValueBase64 });
                    assert.equal(listResponse.body.nextPage, expectedLink);
                });
                it(`NextPage path does not contain count and parameters if there are no additional files in ${requestType} list`, async function () {
                    this.timeout(CUSTOM_TIMEOUT);
                    await clearAllFiles(dataStorageRequests, requestType);
                    const expectedLink = generateNextPageLink();
                    const listResponse = match.success(await dataStorageRequests.getListOfFiles(requestType), dataStorageSchemas.list);
                    assert.equal(listResponse.body.nextPage, expectedLink);
                });
                it(`NextPage paths count uses count value from current request in ${requestType} list`, async function () {
                    this.timeout(CUSTOM_TIMEOUT);
                    await clearAllFiles(dataStorageRequests, requestType);
                    const expectedLink = generateNextPageLink(PAGINATION_MIN_COUNT);
                    const listResponse = match.success(await dataStorageRequests.getListOfFiles(requestType, PAGINATION_MIN_COUNT), dataStorageSchemas.list);
                    assert.equal(listResponse.body.nextPage, expectedLink);
                });
            });
        });
        // eslint-disable-next-line no-loop-func
        describe('Check creating upload link on data storage service', function () {
            const testCreatingFileLink = async function (requestType, data) {
                const createLinkResult = match.success(await dataStorageRequests.postCreateLink(requestType, data), dataStorageSchemas.link);
                data.owner = data.owner || DEFAULT_OWNER;
                const expectedPartialPath = `/${info.companyId}/${requestType}/${data.owner}/${md5(data.name)}?`;
                assert.include(unescape(createLinkResult.body.path), expectedPartialPath);
            };
            for (const [dataSetName, data] of Object.entries(testData.createLinkData)) {
                it(`File upload link is created with data: ${dataSetName} in ${requestType} path`, testCreatingFileLink.bind(this, requestType, data));
            }
            it(`File upload link is created with name that was used and deleted in ${requestType} endpoint`, async function () {
                const fileData = generateTestFileData();
                await uploadFileByNewLink(dataStorageRequests, requestType, fileData);
                await waitForFileUploaded(dataStorageRequests, requestType, fileData);

                match.success(await dataStorageRequests.deleteFile(requestType, fileData.name), dataStorageSchemas.delete);

                await sleep(EVENT_WAIT_TIME);
                const requestData = {
                    name: fileData.name,
                    owner: DEFAULT_OWNER
                };
                const createLinkResult = match.success(await dataStorageRequests.postCreateLink(requestType, requestData));
                const expectedPartialPath = `/${info.companyId}/${requestType}/${DEFAULT_OWNER}/${md5(fileData.name)}?`;
                assert.include(unescape(createLinkResult.body.path), expectedPartialPath);
            });
        });
        // eslint-disable-next-line no-loop-func
        describe('Check uploading/downloading file to the data storage service', function () {
            const testUploadingFile = async function (requestType, fileData) {
                const testFileData = generateTestFileData(fileData);
                await uploadFileByNewLink(dataStorageRequests, requestType, testFileData);

                const downloadFileResponse = await getLinkAndDownloadFile(dataStorageRequests, requestType, testFileData.name);
                const fileDataBuffer = await readFileToBuffer(testFileData.path);
                const expectedFileData = fileDataBuffer.toString('utf-8');
                assert.deepEqual(downloadFileResponse.text, expectedFileData);
            };
            for (const [type, data] of Object.entries(testFiles.files)) {
                it(`${type} file is uploaded to ${requestType} path and can be downloaded`, testUploadingFile.bind(this, requestType, data));
            }
        });
        // eslint-disable-next-line no-loop-func
        describe('Check deleting file from data storage service', function () {
            before('Clear existing files', async function () {
                this.timeout(CUSTOM_TIMEOUT);
                await clearAllFiles(dataStorageRequests, requestType);
            });
            it(`Deleted files are removed from listing in ${requestType} endpoint`, async function () {
                this.timeout(CUSTOM_TIMEOUT);
                const createdFilesNames = await uploadTestFiles(dataStorageRequests, requestType);

                for (const fileName of createdFilesNames) {
                    match.success(await dataStorageRequests.deleteFile(requestType, fileName), dataStorageSchemas.delete);

                    await sleep(EVENT_WAIT_TIME);
                    const newListResponse = match.success(await dataStorageRequests.getListOfFiles(requestType, PAGINATION_BIG_COUNT));
                    const matchingFilenames = newListResponse.body.items.filter(fileData => fileData.name === fileName);
                    assert.isEmpty(matchingFilenames);
                }
            });
            it(`Deleted files are unavailable in ${requestType} download link endpoint`, async function () {
                this.timeout(CUSTOM_TIMEOUT);
                const createdFilesNames = await uploadTestFiles(dataStorageRequests, requestType);

                for (const fileName of createdFilesNames) {
                    match.success(await dataStorageRequests.deleteFile(requestType, fileName), dataStorageSchemas.delete);
                    await sleep(EVENT_WAIT_TIME);
                    match.notFound(await dataStorageRequests.getDownloadLink(requestType, fileName));
                }
            });
        });
        // eslint-disable-next-line no-loop-func
        describe(`Check negative tests in ${requestType}`, function () {
            describe('Check negative tests for getting download link', function () {
                it(`404 Not Found is returned for inexisting filename in ${requestType} download link endpoint`, async function () {
                    match.notFound(await dataStorageRequests.getDownloadLink(requestType, Date.now()));
                });
            });
            describe('Check negative tests for getting files list', function () {
                before('Clear existing files', async function () {
                    this.timeout(CUSTOM_TIMEOUT);
                    await clearAllFiles(dataStorageRequests, requestType);
                });
                const testInvalidGetListRequest = async function (requestType, dataSet) {
                    const getListReponse = await dataStorageRequests.getListOfFiles(requestType, dataSet.request);
                    match.badRequest(getListReponse, dataSet.response);
                };
                for (const [dataSetName, data] of Object.entries(testData.getListInvalidData)) {
                    it(`Server returns 400 Bad Request when getting files list with invalid data: ${dataSetName} in ${requestType} path`, testInvalidGetListRequest.bind(this, requestType, data));
                }
            });
            describe('Check negative tests for creating upload link', function () {
                before('Clear existing files', async function () {
                    this.timeout(CUSTOM_TIMEOUT);
                    await clearAllFiles(dataStorageRequests, requestType);
                });
                const testInvalidCreateLinkRequest = async function (requestType, dataSet) {
                    const createLinkReponse = await dataStorageRequests.postCreateLink(requestType, dataSet.request);
                    match.badRequest(createLinkReponse, dataSet.response);
                };
                for (const [dataSetName, data] of Object.entries(testData.createLinkInvalidData)) {
                    it(`Server returns 400 Bad Request when creating file upload link with invalid data: ${dataSetName} in ${requestType} path`, testInvalidCreateLinkRequest.bind(this, requestType, data));
                }
                it(`Server returns 400 Bad Request when creating file upload link if filename already taken in ${requestType} list`, async function () {
                    const fileData = generateTestFileData();

                    await uploadFileByNewLink(dataStorageRequests, requestType, fileData);
                    await waitForFileUploaded(dataStorageRequests, requestType, fileData);

                    const customOwner = Date.now();
                    const createLinkReponse = await dataStorageRequests.postCreateLink(requestType, { name: fileData.name, owner: customOwner });
                    match.badRequest(createLinkReponse);
                    assert.include(createLinkReponse.body.message, 'File already exists');
                    assert.include(createLinkReponse.body.message, `${info.companyId}/${requestType}/${customOwner}/${md5(fileData.name)}`);
                });
            });
        });
        // eslint-disable-next-line no-loop-func
        describe('Check authorization and permissions', function () {
            let invalidTokenRequests, getPermissionsRequests, postPermissionsRequests, deletePermissionsRequests, invalidAuthRequests, invalidAuditorRequests, methodScopeRequests;
            before('Create requests with various authorizations', async function () {
                const getPermissionsTokenResponse = match.success(await authRequests.createOpenIdServiceToken(getAuthTokenData('get')));
                const postPermissionsTokenResponse = match.success(await authRequests.createOpenIdServiceToken(getAuthTokenData('post')));
                const deletePermissionsTokenResponse = match.success(await authRequests.createOpenIdServiceToken(getAuthTokenData('delete')));
                const invalidAuditorTokenResponse = match.success(await authRequests.createOpenIdServiceToken(getAuthTokenData(null, 'test')));
                invalidTokenRequests = new DataStorageRequests(props, ['']);
                invalidAuditorRequests = new DataStorageRequests(props, [invalidAuditorTokenResponse.body.result.id_token]);
                getPermissionsRequests = new DataStorageRequests(props, [getPermissionsTokenResponse.body.result.id_token]);
                postPermissionsRequests = new DataStorageRequests(props, [postPermissionsTokenResponse.body.result.id_token]);
                deletePermissionsRequests = new DataStorageRequests(props, [deletePermissionsTokenResponse.body.result.id_token]);

                invalidAuthRequests = {
                    invalidToken: invalidTokenRequests,
                    invalidAuditor: invalidAuditorRequests
                };
                methodScopeRequests = {
                    get: getPermissionsRequests,
                    post: postPermissionsRequests,
                    delete: deletePermissionsRequests,
                };
            });
            describe('Server returns 401 Unauthorized for all requests with invalid token or invalid auditor', function () {
                const testRequestUnauthorized = async function (dataSetName, requestName) {
                    match.unauthorized(await invalidAuthRequests[dataSetName][requestName](requestType));
                };
                for (const dataSetName of ['invalidToken', 'invalidAuditor']) {
                    for (const requestName of Object.keys(DataStorageRequests.prototype)) {
                        it(
                            `Server returns 401 Unauthorized for ${requestName} request with ${dataSetName} auth in ${requestType} path`,
                            testRequestUnauthorized.bind(this, dataSetName, requestName)
                        );
                    }
                }
            });
            describe('Server returns 403 Forbidden for requests with token without matching method scope', function () {
                const testRequestAccessError = async function (methodName, requestName) {
                    match.accessError(await methodScopeRequests[methodName][requestName](requestType));
                };
                for (const methodName of ['get', 'delete']) {
                    it(
                        `Server returns 403 for POST request with ${methodName} permissions in ${requestType} path`,
                        testRequestAccessError.bind(this, methodName, 'postCreateLink')
                    );
                }
                for (const methodName of ['post', 'delete']) {
                    it(
                        `Server returns 403 for GET list request with ${methodName} permissions in ${requestType} path`,
                        testRequestAccessError.bind(this, methodName, 'getListOfFiles')
                    );
                    it(
                        `Server returns 403 for GET download link request with ${methodName} permissions in ${requestType} path`,
                        testRequestAccessError.bind(this, methodName, 'getDownloadLink')
                    );
                }
                for (const methodName of ['get', 'post']) {
                    it(
                        `Server returns 403 for DELETE file request with ${methodName} permissions in ${requestType} path`,
                        testRequestAccessError.bind(this, methodName, 'deleteFile')
                    );
                }
                it(`Server returns 200 OK for POST request with post permissions in ${requestType} path`, async function () {
                    match.success(await postPermissionsRequests.postCreateLink(requestType, testData.createLinkData.charactersData), dataStorageSchemas.link);
                });
                it(`Server returns 200 OK for GET list request with get permissions in ${requestType} path`, async function () {
                    match.success(await getPermissionsRequests.getListOfFiles(requestType));
                });
                it(`Server returns 302 Found for GET download link request with get permissions in ${requestType} path`, async function () {
                    const fileData = generateTestFileData();

                    await uploadFileByNewLink(dataStorageRequests, requestType, fileData);

                    await fluentWait(getDownloadUrl.bind(this, dataStorageRequests, requestType, fileData.name));
                    match.found(await getPermissionsRequests.getDownloadLink(requestType, fileData.name));
                });
                it(`Server returns 200 OK for DELETE file request with delete permissions in ${requestType} path`, async function () {
                    const fileData = generateTestFileData();

                    await uploadFileByNewLink(dataStorageRequests, requestType, fileData);
                    await waitForFileUploaded(dataStorageRequests, requestType, fileData);

                    match.success(await deletePermissionsRequests.deleteFile(requestType, fileData.name), dataStorageSchemas.delete);
                });
            });
            describe('S3 returns 403 Forbidden for all requests without valid tokens', function () {
                it(`S3 returns 403 Forbidden for GET file request without valid tokens in ${requestType} path`, async function () {
                    const fileData = generateTestFileData();

                    await uploadFileByNewLink(dataStorageRequests, requestType, fileData);

                    const downloadUrl = await fluentWait(getDownloadUrl.bind(this, dataStorageRequests, requestType, fileData.name));
                    const urlWithoutTokens = downloadUrl.split('?').shift();
                    const s3Response = await s3Requests.downloadFileFromS3(urlWithoutTokens);
                    assert.equal(s3Response.statusCode, 403);
                });
                it(`S3 returns 403 Forbidden for PUT file request without valid tokens in ${requestType} path`, async function () {
                    const fileData = generateTestFileData();

                    const createLinkReponse = await dataStorageRequests.postCreateLink(requestType, { name: fileData.name });
                    match.success(createLinkReponse, dataStorageSchemas.link);
                    const urlWithoutTokens = createLinkReponse.body.path.split('?').shift();

                    const s3Response = await s3Requests.uploadFileToS3(urlWithoutTokens, fileData.path);
                    assert.equal(s3Response.statusCode, 403);
                });
            });
        });
    }
});
