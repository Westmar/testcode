const BaseApi = require('../BaseApi');
const binaryParser = require('../../lib/BinaryParser');
const REQUEST_TYPES = {
    voicemails: 'voicemailsPath',
    recordings: 'recordingsPath',
    faxes: 'faxesPath',
    backups: 'backupsPath'
};

class DataStorageRequests extends BaseApi {
    constructor(props, auth) {
        super();
        this.props = props;
        this.request = chai.request(props.dataStorageUrl);
        this.auth = auth;
        this.voicemailsPath = 'api/v1/voicemails';
        this.recordingsPath = 'api/v1/recordings';
        this.faxesPath = 'api/v1/faxes';
        this.backupsPath = 'api/v1/backups';
        this.conversation = 'api/v1/conversation/';
        this.binaryParser = binaryParser;
    }

    getDownloadLink(type, fileName) {
        const request = this.request
            .get(`${this[REQUEST_TYPES[type]]}/${fileName}`)
            .redirects(0);
        DataStorageRequests.addDefaultMiddlewares(request);
        return DataStorageRequests.chooseAuth(request, this.auth);
    }

    getListOfFiles(type, parameter = {}) {
        const request = this.request
            .get(this[REQUEST_TYPES[type]])
            .query(parameter);
        DataStorageRequests.addDefaultMiddlewares(request);
        return DataStorageRequests.chooseAuth(request, this.auth);
    }

    postCreateLink(type, data = null) {
        const request = this.request
            .post(this[REQUEST_TYPES[type]]);
        if (data) request.send(data);
        DataStorageRequests.addDefaultMiddlewares(request);
        return DataStorageRequests.chooseAuth(request, this.auth);
    }

    deleteFile(type, fileName) {
        const request = this.request
            .delete(`${this[REQUEST_TYPES[type]]}/${fileName}`);
        DataStorageRequests.addDefaultMiddlewares(request);
        return DataStorageRequests.chooseAuth(request, this.auth);
    }

    postCreatePresignedURL(chat, data) {
        const request = this.request.post(`${this.conversation}${chat}`).send(data);
        DataStorageRequests.addDefaultMiddlewares(request);
        return DataStorageRequests.chooseAuth(request, this.auth);
    }

    getFileInfoInConversation(chat, fieldId) {
        const request = this.request.get(`${this.conversation}${chat}/${fieldId}`);
        DataStorageRequests.addDefaultMiddlewares(request);
        return DataStorageRequests.chooseAuth(request, this.auth);
    }

    postForwardFileInConversation(chat, fieldId, data) {
        const createURL = `${this.conversation}${chat}/${fieldId}/forward`;
        const request = this.request.post(createURL).send(data);
        DataStorageRequests.addDefaultMiddlewares(request);
        return DataStorageRequests.chooseAuth(request, this.auth);
    }

    getDownloadLinkInConversation(chat, fieldId) {
        const request = this.request
            .get(`${this.conversation}${chat}/${fieldId}/download`)
            .redirects(0);
        DataStorageRequests.addDefaultMiddlewares(request);
        return DataStorageRequests.chooseAuth(request, this.auth);
    }
}

module.exports = {
    REQUEST_TYPES,
    DataStorageRequests
};
