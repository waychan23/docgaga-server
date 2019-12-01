var model = {};
var registry = require('../config/services-registry');

const scopes = registry.scopes;
const services = registry.services;

var storage;

const DEFAULT_AUTHORIZATION_CODE_TTL = 5 * 60, // 5 mins
	  DEFAULT_ACCESS_TOKEN_TTL = 2 * 60 * 60, // 1 hr
	  DEFAULT_REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60; // 30 days

function isNum(num){
	return !isNaN(parseInt(num));
}

function expiration(date, type){
	if(date instanceof Date){
		return date;
	}
	if(isNum(date)){
		return new Date(date);
	}

	if(!type){
		throw "no expiration or type specified";
	}

	var ct = new Date().getTime(),
		ttl = 0;

	switch(type){
	case 'a_t':
		ttl = DEFAULT_ACCESS_TOKEN_TTL;
		break;
	case 'a_c':
		ttl = DEFAULT_AUTHORIZATION_CODE_TTL;
		break;
	case 'r_t':
		ttl = DEFAULT_REFRESH_TOKEN_TTL;
		break;
	default:
		throw "wrong grant type: " + type;
	}

	date = new Date(ct + ttl);

	return date;
}

function ttl(num, type){
	if(isNum(num)){
		return num;
	}
	if(!type){
		throw "no ttl or type specified";
	}

	switch(type){
	case 'a_t':
		num = DEFAULT_ACCESS_TOKEN_TTL;
		break;
	case 'a_c':
		num = DEFAULT_AUTHORIZATION_CODE_TTL;
		break;
	case 'r_t':
		num = DEFAULT_REFRESH_TOKEN_TTL;
		break;
	default:
		throw "wrong grant type: " + type;
	}

	return num;
}

/*
 * API: generateAccessToken(client, user, scope, [callback])
 * This model function is optional. 
 * If not implemented, a default handler is used that generates access tokens
 *  consisting of 40 characters in the range of a..z0..9.
 */
model.generateAccessToken = undefined;

/*
 * API: generateRefreshToken(client, user, scope, [callback])
 * This model function is optional.
 * If not implemented, a default handler is used that generates refresh tokens
 *  consisting of 40 characters in the range of a..z0..9.
 */
model.generateRefreshToken = undefined;

/*
 * API: generateAuthorizationCode(client, user, scope, [callback])
 * This model function is optional. 
 * If not implemented, a default handler is used that generates authorization codes
 *  consisting of 40 characters in the range of a..z0..9.
 */
model.generateAuthorizationCode = undefined;

/*
 * API: getAccessToken(accessToken, [callback])
 * This model function is required if OAuth2Server#authenticate() is used.
 */
model.getAccessToken = getAccessToken;

async function getAccessToken(accessToken){
	var t = await storage.getAccessToken(accessToken),
		client, token;

	if(t){
		client = await getClient(t.client);

		if(!client){
			return null;
		}

		token = {
			'accessToken': t.accessToken,
			'accessTokenExpiresAt': t.accessTokenExpiresAt instanceof Date? t.accessTokenExpiresAt: new Date(t.accessTokenExpiresAt),
			'scope': t.scope,
			'client': client,
			'user': findUserByUsername(t.user)
		};
	}
	
	return token || null;
};

/*
 * API: getRefreshToken(refreshToken, [callback])
 * This model function is required if the refresh_token grant is used.
 */
model.getRefreshToken = getRefreshToken;

async function getRefreshToken(refreshToken){
	var t = await storage.getRefreshToken(refreshToken),
		client, token;

	if(t){
		client = await getClient(t.client);

		if(!client){
			return null;
		}

		token = {
			'refreshToken': t.refreshToken,
			'refreshTokenExpiresAt': t.refreshTokenExpiresAt instanceof Date? t.refreshTokenExpiresAt: new Date(t.refreshTokenExpiresAt),
			'scope': t.scope,
			'client': client,
			'user': findUserByUsername(t.user)
		};
	}

	return token || null;
};

/*
 * API: getAuthorizationCode(authorizationCode, [callback])
 * This model function is required if the authorization_code grant is used.
 * @param {String} authorizationCode
 * @param {Function} callback
 * @return {Object} code
 */
model.getAuthorizationCode = getAuthorizationCode;

async function getAuthorizationCode(authorizationCode){
	var c = await storage.getAuthorizationCode(authorizationCode),
		client, code;

	if(c){
		client = await getClient(c.client);

		if(!client){
			return null;
		}

		code = {
			'code': c.authorizationCode,
			'expiresAt': c.expiresAt instanceof Date? c.expiresAt: new Date(c.expiresAt),
			'redirectUri': c.redirectUri,
			'scope': c.scope,
			'client': client,
			'user': findUserByUsername(c.user)
		};
	}

	return code;
};

/*
 * API: getClient(clientId, clientSecret, [callback])
 * This model function is required for all grant types.
 */
model.getClient = getClient;

async function getClient(clientId, clientSecret){
	var c = registry.findClient(clientId, clientSecret),
		client;

	client = !c? null: {
		'id': c.clientId,
		'grants': c.grants,
		'redirectUris': c.redirectUris,
		'accessTokenLifetime': c.accessTokenLifetime,
		'refreshTokenLifetime': c.refreshTokenLifetime
	};

	return client || null;
};

/*
 * API: getUser(username, password, [callback])
 * This model function is required if the password grant is used.
 */
model.getUser = null;

/*
 * API: getUserFromClient(client, [callback])
 * This model function is required if the client_credentials grant is used.
 */
model.getUserFromClient = null;

/*
 * API: saveToken(token, client, user, [callback])
 * This model function is required for all grant types.
 */
model.saveToken = saveToken;

async function saveToken(token, client, user){
	var common,
		accessToken,
		refreshToken,
		atExp, rtExp;

	common = {
		'scope': token.scope,
		'client': client.id,
		'user': user.username
	};

	atExp = expiration(token.accessTokenExpiresAt, 'a_t');

	accessToken = Object.assign({}, common, {
		'accessToken': token.accessToken,
		'accessTokenExpiresAt': atExp.getTime()
	});

	if(token.refreshToken){
		refreshToken = await storage.getRefreshToken(token.refreshToken);

		if(!refreshToken){
			rtExp = expiration(token.refreshTokenExpiresAt, 'r_t');

			refreshToken = Object.assign({}, common, {
				'refreshToken': token.refreshToken,
				'refreshTokenExpiresAt': rtExp.getTime()
			});

			await storage.setRefreshToken(token.refreshToken, refreshToken, rtExp);
		}else{
			rtExp = expiration(refreshToken.refreshTokenExpiresAt, 'r_t');
		}
	}

	await storage.setAccessToken(token.accessToken, accessToken, atExp);

	return Object.assign({
		'client': client,
		'user': user
	}, token, {
		'accessTokenExpiresAt': atExp,
		'refreshTokenExpiresAt': rtExp
	});
};

/*
 * API: saveAuthorizationCode(code, client, user, [callback])
 * This model function is required if the authorization_code grant is used.
 */
model.saveAuthorizationCode = saveAuthorizationCode;

async function saveAuthorizationCode(code, client, user){
	var codeToSave,
		exp;

	exp = expiration(code.expiresAt, 'a_c');

	codeToSave = {
		'authorizationCode': code.authorizationCode,
		'expiresAt': exp.getTime(),
		'redirectUri': code.redirectUri,
		'scope': code.scope,
		'client': client.id,
		'user': user.username
	};

	await storage.setAuthorizationCode(code.authorizationCode, codeToSave, exp);

	return Object.assign({
		'client': client,
		'user': user
	}, code, {
		'expireAt': exp
	});
};

/*
 * Revoke a refresh token.
 * API: revokeToken(token, [callback])
 * This model function is required if the refresh_token grant is used.
 */
model.revokeToken = revokeToken;

async function revokeToken(token){
	return await storage.removeRefreshToken(token.refreshToken);
};

/*
 * API: revokeAuthorizationCode(code, [callback])
 * This model function is required if the authorization_code grant is used.
 */
model.revokeAuthorizationCode = revokeAuthorizationCode;

async function revokeAuthorizationCode(code){
	return await storage.removeAuthorizationCode(code.code);
};

/*
 * API: validateScope(user, client, scope, [callback])
 * This model function is optional. If not implemented, any scope is accepted.
 */
model.validateScope = validateScope;

async function validateScope(user, client, scope){
	return registry.validateScope(client.id, scope);
};

/*
 * API: verifyScope(accessToken, scope, [callback])
 * This model function is required if scopes are used with OAuth2Server#authenticate().
 */
model.verifyScope = verifyScope;

async function verifyScope(accessToken, scope){
	var t = await getAccessToken(accessToken.accessToken);

	if(!t || !t.scope || !scope || t.scope != scope){
		return false;
	}

	return true;
};

function findUserByUsername(username){
	if(typeof username != 'string' || username.length < 1){
		return null;
	}
	return { 'username': username };
}

module.exports = function(options){
	options = options || {};

	if(!options.storage){
		throw 'No storage specified for model!';
	}

	storage = options.storage;

	return model;
};
