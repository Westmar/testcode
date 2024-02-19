const openIdService = {
    type: 'object',
    additionalProperties: false,
    required: [
        'type',
        'result'
    ],
    properties: {
        type: {
            type: 'string',
        },
        result: {
            type: 'object',
            additionalProperties: false,
            required: [
                'id_token',
                'expires'
            ],
            properties: {
                'id_token': {
                    type: 'string',
                },
                expires: {
                    type: 'number',
                }
            }
        }

    }
};

const userMeV1 = {
    type: 'object',
    additionalProperties: false,
    required: [
        'type',
        'result'
    ],
    properties: {
        type: {
            type: 'string',
        },
        result: {
            type: 'object',
            additionalProperties: false,
            required: [
                'username',
                'name',
                'mail'
            ],
            properties: {
                username: {
                    type: 'string',
                },
                name: {
                    type: 'string',
                },
                mail: {
                    type: 'string',
                }
            }
        }

    }
};
const userMeV2 = {
    type: 'object',
    additionalProperties: false,
    required: [
        'type',
        'result'
    ],
    properties: {
        type: {
            type: 'string',
        },
        result: {
            type: 'object',
            additionalProperties: false,
            required: [
                'id',
                'name',
                'email',
                'extension',
                'language',
                'jid',
                'groupDn',
                'licenseType',
                'avatar',
                'dialplan',
                '*',
                'companyId'
            ],
            properties: {
                id: {
                    type: 'string',
                },
                name: {
                    type: 'string',
                },
                email: {
                    type: 'string',
                },
                extension: {
                    type: 'string',
                },
                language: {
                    type: 'string',
                },
                jid: {
                    type: 'string',
                },
                groupDn: {
                    type: 'string',
                },
                licenseType: {
                    type: 'string',
                },
                avatar: {
                    type: 'string',
                },
                dialplan: {
                    type: 'string',
                },
                '*': {
                    type: 'string',
                },
                companyId: {
                    type: 'string',
                }
            }
        }

    }
};

module.exports = {
    openIdService,
    userMeV1,
    userMeV2
};
