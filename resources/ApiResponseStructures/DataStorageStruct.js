const listingStruct = {
    type: 'object',
    required: ['items', 'nextPage'],
    additionalProperties: false,
    properties: {
        items: {
            type: 'array',
            items: [
                {
                    type: 'object',
                    required: ['created', 'region', 'companyId', 'serial', 'domain', 'owner', 'size', 'name'],
                    additionalProperties: false,
                    properties: {
                        created: {
                            type: 'number'
                        },
                        region: {
                            type: 'string'
                        },
                        companyId: {
                            type: 'string'
                        },
                        serial: {
                            type: 'string'
                        },
                        domain: {
                            type: 'string'
                        },
                        owner: {
                            type: 'string'
                        },
                        size: {
                            type: 'number'
                        },
                        name: {
                            type: 'string'
                        }
                    }
                }
            ]
        },
        nextPage: {
            type: 'string'
        },
    }
};

const createLinkStruct = {
    type: 'object',
    required: ['path'],
    additionalProperties: false,
    properties: {
        path: {
            type: 'string'
        }
    }
};

const deleteFileStruct = {
    type: 'object',
    required: ['success'],
    additionalProperties: false,
    properties: {
        success: {
            type: 'boolean'
        }
    }
};

module.exports = {
    list: listingStruct,
    link: createLinkStruct,
    delete: deleteFileStruct
};
