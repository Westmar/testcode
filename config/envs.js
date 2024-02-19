let envType = process.env.ENV_TYPE;

const test = {
    serial: '*', //  automation
    hostName: '*',
    domainName: '*', //ip if domain is unreachable
    url: '*',
    adminUsername: '*',
    adminExtension: '*',
    adminPassword: '*',
    adminEmail: '*',
    companyId: '*',
    companyName: '*',
    sshPort: 2222,
    user: {
        name: '*',
        extension: '*',
        password: '*'
    },
    'server': {
        loginUri: '*',
        ClientId: '*',
        redirectUri: '*',
        tokenUrl: '*',
        refresh_token: '*',
        wid: '*'
    }
};


const stage = {
    test: {
        ...test,
        serial: '*', //  automation
        hostName: '*',
        domainName: '*', //ip if domain is unreachable
        url: '*',
        adminEmail: '*',
        companyId: '*',
        companyName: '*',
        'server': {
            loginUri: '*',
            ClientId: '*',
            redirectUri: '*',
            tokenUrl: '*',
            refresh_token: '*',
            wid: '*'
        }
    },
    auth: '*',
    'data-storage': '*',
};
const prod = {
    test: test,
    auth: '*',
    'data-storage': '*',
};

const chooseEnv = function (environment) {
    switch (environment) {
        case 'prod':
            return prod;
        default:
            return stage;
    }
};

const launchEnvironment = {
    services: chooseEnv(envType),
};

module.exports = launchEnvironment;
