const createPresignedUrlStruct = {
    type: 'object',
    required: ['type', 'result'],
    properties: {
        'type': {
            type: 'string'
        },
        result: {
            type: 'object',
            required: ['path', 'id'],
            properties: {
                path: {
                    type: 'string'
                },
                id: {
                    type: 'string'
                }
            },
        }
    }
};

const responseInfoStruct = {
    type: 'object',
    required: ['type', 'result'],
    properties: {
        type: {
            type: 'string'
        },
        result: {
            type: 'object',
            required: ['created', 'name', 'owner', 'region', 'size', 'companyId', 'id', 'chatId', 'parentId', 'mime', 'width', 'height', 'preview'],
            properties: {
                created: {
                    type: 'number'
                },
                name: {
                    type: 'string'
                },
                owner: {
                    type: 'string'
                },
                region: {
                    type: 'string'
                },
                companyId: {
                    type: 'string'
                },
                size: {
                    type: 'number'
                },
                id: {
                    type: 'string'
                },
                chatId: {
                    type: 'string'
                },
                parentId: {
                    type: 'string'
                },
                mime: {
                    type: 'string'
                },
                width: {
                    type: 'number'
                },
                height: {
                    type: 'number'
                },
                preview: {
                    type: 'string'
                }
            }
        },
    }
};

module.exports = {
    presignedLink: createPresignedUrlStruct,
    responseInfo: responseInfoStruct
};
