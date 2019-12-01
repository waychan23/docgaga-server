const Router = require('koa-router');
const OAuthServer = require('koa2-oauth-server');
const oauthStorage = require('../storage/oauth-storage');
const oauthModel = require('../oauth-model/general');
const mongoTokenStorage = require('../storage/mongo-token-storage');

const registry = require('../config/services-registry');

const prefix = '/oauth';

function atTrans(o){
	var no = Object.assign({}, o);

	no.accessToken = o.token;
	no.accessTokenExpiresAt = o.expiresAt;

	return no;
}

function rtTrans(o){
	var no = Object.assign({}, o);

	no.refreshToken = o.token;
	no.refreshTokenExpiresAt = o.token;

	return no;
}

function unwrapKey(k){
	return k.replace(/^[^:]*:/, '');
}

function OAuthRouter(app, options){
	options = options || {};

	app.oauthStorage = oauthStorage({
		authorizationCodeStore: null,
		accessTokenStore: mongoTokenStorage({ tokenType: 'a_t', transformer: atTrans, unwrapKey: unwrapKey }),
		refreshTokenStore: mongoTokenStorage({ tokenType: 'r_t', transformer: rtTrans, unwrapKey: unwrapKey, recordUpdateTime: true })
	});

	app.oauthModel = oauthModel({
		storage: app.oauthStorage
	});

	app.oauth = new OAuthServer({
		model: app.oauthModel,
		useErrorHandler: true
	});
	
	var oauth = app.oauth,
		authenticateHandler = AuthenticateHandler(),
		router = new Router({
			'prefix': prefix
		});

	router.get('/authorize', oauth.authorize({
		'authenticateHandler': authenticateHandler
	}));

	router.post('/token', oauth.token());

	router.post('/revoke', revokeToken);

	router.use(async (ctx, next) => {
		if(ctx.state.oauth && ctx.state.oauth.error){
			console.error(ctx.state.oauth.error);
			ctx.throw(ctx.state.oauth.error);
			return;
		}
		await next();
	});

	/**
	 * @header {String} [x-access-token] -
	 * @header {String} x-refresh-token - 
	 * @bodyParam {String} client_id - 
	 * @bodyParam {String} client_secret - 
	 * @return {application/json} - { success }
	 */
	async function revokeToken(ctx, next){
		var { client_id, client_secret } = ctx.request.body,
			accessToken = ctx.get('x-access-token'),
			refreshToken = ctx.get('x-refresh-token'),
			client, token;
		
		if(!client_id || !client_secret){
			return ctx.status = 401;
		}

		if(!refreshToken){
			return ctx.status = 400;
		}

		client = registry.findClient(client_id, client_secret);

		if(!client){
			return ctx.status = 401;
		}

		token = await app.oauthStorage.getRefreshToken(refreshToken);

		if(token && (typeof token.client == 'object'?token.client.id: token.client) == client_id){
			await app.oauthStorage.removeRefreshToken(refreshToken);
		}

		token = await app.oauthStorage.getAccessToken(accessToken);

		if(accessToken){
			await app.oauthStorage.removeAccessToken(accessToken);
		}

		return ctx.body = {
			success: true
		};
	}

	return router;
}

function AuthenticateHandler(){
	return {
		handle: async function authenticateHandler(request, response){
			return request.session && request.session.loginUser;
		}
	};
}


module.exports = OAuthRouter;
