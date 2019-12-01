const RuntimeMemoryStore = require('simple-memory-storage');

const KEY_TYPE_AUTHORIZATION_CODE = 'c',
		KEY_TYPE_ACCESS_TOKEN = 't',
		KEY_TYPE_REFRESH_TOKEN = 'r';

function OAuthStorage(options){
	if(!(this instanceof OAuthStorage)){
		return new OAuthStorage(options);
	}

	this.authorizationCodeStore = options.authorizationCodeStore || new RuntimeMemoryStore();
	this.accessTokenStore = options.accessTokenStore || new RuntimeMemoryStore();
	this.refreshTokenStore = options.refreshTokenStore || new RuntimeMemoryStore();

	return this;
}

OAuthStorage.prototype.setAuthorizationCode = setAuthorizationCode;

OAuthStorage.prototype.getAuthorizationCode = getAuthorizationCode;

OAuthStorage.prototype.removeAuthorizationCode = removeAuthorizationCode;

OAuthStorage.prototype.setAccessToken = setAccessToken;

OAuthStorage.prototype.getAccessToken = getAccessToken;

OAuthStorage.prototype.removeAccessToken = removeAccessToken;

OAuthStorage.prototype.getRefreshToken = getRefreshToken;

OAuthStorage.prototype.setRefreshToken = setRefreshToken;

OAuthStorage.prototype.removeRefreshToken = removeRefreshToken;

async function setAuthorizationCode(key, value, expireTime){
	var self = this,
		store = self.authorizationCodeStore;
	
	key = wrapKey(KEY_TYPE_AUTHORIZATION_CODE, key);

	return await store.setExpiration(key, value, expireTime);
}

async function getAuthorizationCode(key){
	key = wrapKey(KEY_TYPE_AUTHORIZATION_CODE, key);

	var self = this,
		store = self.authorizationCodeStore,
		item = await store.get(key);

	return item || null;
}

async function removeAuthorizationCode(key){
	var self = this,
		store = self.authorizationCodeStore;

	key = wrapKey(KEY_TYPE_AUTHORIZATION_CODE, key);

	return await store.remove(key);
}

async function setAccessToken(key, value, expireTime){
	var self = this,
		store = self.accessTokenStore;

	key = wrapKey(KEY_TYPE_ACCESS_TOKEN, key);

	return await store.setExpiration(key, value, expireTime);
}

async function getAccessToken(key){
	key = wrapKey(KEY_TYPE_ACCESS_TOKEN, key);

	var self = this,
		store = self.accessTokenStore,
		item = await store.get(key);

	return item || null;
}

async function removeAccessToken(key){
	var self = this,
		store = self.accessTokenStore;

	key = wrapKey(KEY_TYPE_ACCESS_TOKEN, key);

	return await store.remove(key);
}

async function setRefreshToken(key, value, expireTime){
	var self = this,
		store = self.refreshTokenStore;

	key = wrapKey(KEY_TYPE_REFRESH_TOKEN, key);

	return await store.setExpiration(key, value, expireTime);
}

async function getRefreshToken(key){
	key = wrapKey(KEY_TYPE_REFRESH_TOKEN, key);

	var self = this,
		store = self.refreshTokenStore,
		item = await store.get(key);

	return item || null;
}

async function removeRefreshToken(key){
	var self = this,
		store = self.refreshTokenStore;

	key = wrapKey(KEY_TYPE_REFRESH_TOKEN, key);

	return await store.remove(key);
}

function wrapKey(type, key){
	switch(type){
		case KEY_TYPE_AUTHORIZATION_CODE: 
			key = `${KEY_TYPE_AUTHORIZATION_CODE}:${key}`;
			break;
		case KEY_TYPE_ACCESS_TOKEN:
			key = `${KEY_TYPE_ACCESS_TOKEN}:${key}`;
			break;
		case KEY_TYPE_REFRESH_TOKEN:
			key = `${KEY_TYPE_REFRESH_TOKEN}:${key}`;
			break;
	}
	return key;
}

module.exports = OAuthStorage;
