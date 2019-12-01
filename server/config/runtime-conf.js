//这只是一个模板，实际运行是从通过Docker挂载实际的配置文件到该位置

const DEFAULT_ACCESS_TOKEN_LIFE_TIME = 60 * 60 * 2;
const DEFAULT_REFRESH_TOKEN_LIFE_TIME = 60 * 60 * 24 * 30;

const GRANT_AUTHORIZATION_CODE = 'authorization_code',
      GRANT_REFRESH_TOKEN = 'refresh_token';
      
const SCOPE_NOTE_READ_WRITE = 's_n_rw',
      SCOPE_KEYWORD_READ_WRITE = 's_k_rw',
      SCOPE_USER_PROFILE_READ = 's_u_r';

module.exports = {
    mongoConfig: {
        url: 'mongodb://docgaga:123456@192.168.41.3:27017/docgaga'
    },
    serverConfig: {
        'host': 'https://api.docgaga.club:8443',
        'port': 8443,
        'urlPrefix': `https://api.docgaga.club:8443/docgaga`,
        'assetsPath': '/docgaga/public',
        'contextPath': '/docgaga'
    },
    oauth2Clients: [{
        'id': 'docgagacrx',
        'clientId': 'docgagacrx',
        'name': '汤圆笔记-浏览器插件',
        'clientSecret': 'd0kkGA9ACHrM3Xt3nSi0N-d99crx_1708111707',
        'grants': [ GRANT_AUTHORIZATION_CODE, GRANT_REFRESH_TOKEN ],
        'scopes': [ SCOPE_USER_PROFILE_READ, SCOPE_NOTE_READ_WRITE, SCOPE_KEYWORD_READ_WRITE ],
        'redirectUris': [ 
            'https://api.docgaga.club:8443/docgagacrx/auth/receiveGrant'
        ],
        'accessTokenLifetime': DEFAULT_ACCESS_TOKEN_LIFE_TIME,
        'refreshTokenLifetime': DEFAULT_REFRESH_TOKEN_LIFE_TIME
    }]
};