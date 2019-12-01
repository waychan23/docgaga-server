const Router = require('koa-router');
const crypto = require('../utils/crypto');
const registry = require('../config/services-registry');
const tokenGen = require('../codegen/token');
const defaultConfig = require('../config/app-conf');
const templateRenderer = require('../renderers/template-renderer');
const validation = {
	'user': require('../validation/user')
};

const userService = require('../services/user-service')();

function AuthRouter(app, options){

	options = Object.assign({ prefix: '', config: defaultConfig }, options);

	var router = new Router({ 'prefix': options.prefix }),
		appConfig = options.config;

	router.all(['/oauth/authorize', '/authorize'], checkLogin);
	router.all(['/oauth/authorize', '/authorize'], authorize);
	router.get('/login', login);
	router.post('/auth', userAuth);

	router.use(templateRenderer({ 'basePath': `${__dirname}/../views`, 'ext': 'html', 'engine': 'lodash' }));

	function getUrl(ctx){
		return `${appConfig.host}${ctx.url}`;
	}

	async function authorize(ctx, next){
		var t = Date.now(),
			reqData = ctx.request.query || ctx.request.body || {},
			clientId = reqData.client_id,
			oauthUri = reqData.oauth_uri,
			scope = reqData.scope,
			agree = (reqData.agree == 'true'),
			logout = (reqData.logout == 'true'),
			deny = (reqData.deny == 'true'),
			client = clientId && registry.findClient(clientId),
			loginUser = ctx.session.loginUser,
			url, privis;

		oauthUri = oauthUri? crypto.fromBase64(oauthUri): oauthUri;

		if(!client || !scope){
			ctx.status = 503;
			return;
		}

		scope = registry.validateScope(client.id, scope);

		if(!scope){
			ctx.status = 503;
			return;
		}
			
		if(ctx.path == `${appConfig.contextPath}/oauth/authorize`){
			if(!agree && !deny && !logout){
				url = getUrl(ctx);
				return gotoAuthorize(ctx, next, {
					clientId: clientId,
					scope: scope,
					oauthUri: crypto.toBase64(url)
				});
			}else if(deny || logout){
				if(logout){
					logoutUser(ctx);
				}
				if(deny){
					redirectToClientWithError(ctx, reqData, 'denied');
				}else{
					redirectToClientWithError(ctx, reqData, 'retry');
				}
				return;
			}else if(agree){
				return await next();
			}
		}else if(ctx.path != `${appConfig.contextPath}/authorize`){
			ctx.status = 404;
			return;
		}

		privis = registry.getScopePrivileges(scope);

		ctx.state.viewName = 'authorization';
		ctx.state.viewModel = viewModel = {
			assetsPath: appConfig.assetsPath,
			clientId: client.id,
			clientName: client.name,
			username: loginUser.username,
			authorizeUrl: oauthUri,
			privis: privis
		};

		await next();
	}

	function determineAccountType(account){
		if(!account){
			return null;
		}

		var vusername = { 'rule': validation.user.rules.username.rule, 'type': 'username' },
			vphone = { 'rule': validation.user.rules.phone.rule, 'type': 'phone' },
			vemail = { 'rule': validation.user.rules.email.rule, 'type': 'email' };

		var tests = [vusername, vphone, vemail];

		for(let i=0;i<tests.length;i++){
			if(tests[i].rule.test(account)){
				return tests[i].type;
			}
		}

		return null;
	}

	async function userAuth(ctx, next){
		var reqData = ctx.request.body,
			account = reqData.account,
			password = reqData.password,
			callbackUri = reqData.callback_uri,
			clientId = reqData.client_id,
			scope = reqData.scope,
			csrfToken = reqData._csrf,
			client, loginUser, accountType, resp;
		
		callbackUri = callbackUri?crypto.fromBase64(callbackUri): callbackUri;
		
		if(!account || !password || !clientId || !scope){
			ctx = 400;
			return;
		}

		client = registry.findClient(clientId);

		if(!client){
			ctx.status = 403;
			return;
		}

		accountType = determineAccountType(account);

		loginUser = await userService.userAuth(accountType, account, password, {
			'type': 'OAUTH',
			'ip': ctx.ip,
			'ua': ctx.get('user-agent')
		});

		if(!loginUser){
			return redirectToLogin('auth');
		}

		ctx.session.loginUser = { username: loginUser.username };

		if(callbackUri){
			ctx.redirect(callbackUri);
		}else{
			ctx.redirect(`${appConfig.contextPath}/index`);
		}

		function redirectToLogin(error){
			redirectToLoginWithError(ctx, {
				clientId: clientId,
				callbackUri: crypto.toBase64(callbackUri),
				scope: scope
			}, error);
		}
	}

	async function login(ctx, next){
		var reqData = ctx.request.query || ctx.request.body || {},
			clientId = reqData.client_id,
			scope = reqData.scope,
			callbackUri = reqData.callback_uri,
			error = reqData.err,
			client = registry.findClient(clientId),
			csrfToken;
		
		if(!client || !scope){
			ctx.status = 403;
			return;
		}

		if(ctx.session.loginUser && callbackUri){
			callbackUri = crypto.fromBase64(callbackUri);
			ctx.redirect(callbackUri);
			return;
		}

		csrfToken = tokenGen.csrfToken();

		ctx.state.viewName = 'login';
		ctx.state.viewModel = viewModel = {
			'loginType': 'oauth',
			'assetsPath': appConfig.assetsPath,
			'clientId': clientId,
			'clientName': client.name,
			'csrfToken': csrfToken,
			'authUrl': `${appConfig.contextPath}/auth`,
			'scope': scope,
			'callbackUri': callbackUri || '',
			'error': {
				'auth': error == 'auth'
			}
		};

		await next();
	}

	async function checkLogin(ctx, next) {
		var reqData = ctx.request.query || ctx.request.body || {},
			clientId = reqData.client_id,
			scope = reqData.scope,
			client = registry.findClient(clientId),
			callbackUri;

		if(!client || !scope){
			ctx.status = 503;
			return;
		}

		if(!ctx.session.loginUser){
			callbackUri = getUrl(ctx);
			callbackUri = callbackUri.replace(/&?(agree|deny|logout)=[^&]*/g, '');

			return redirectToLoginWithError(ctx, {
				clientId: clientId,
				callbackUri: crypto.toBase64(callbackUri),
				scope: scope
			});
		}

		await next();
	}

	function redirect(ctx, uri, query){
		ctx.redirect(composeUri(uri, query));
	}

	function redirectToLoginWithError(ctx, params, error){
		if(!params || !params.clientId || !params.callbackUri || !params.scope){
			throw "params missing";
		}
		error = error || '';
		
		redirect(ctx, `${appConfig.urlPrefix}/login`, {
			'client_id': params.clientId,
			'scope': params.scope,
			'callback_uri': params.callbackUri,
			'err': error
		});
	}


	function gotoAuthorize(ctx, next, data){
		var clientId = data.clientId,
			oauthUri = data.oauthUri,
			scope = data.scope;

		redirect(ctx, `${appConfig.urlPrefix}/authorize`, {
			client_id: clientId,
			scope: scope,
			oauth_uri: oauthUri
		});
	}

	function redirectToClientWithError(ctx, params, error){
		if(!params || !params.client_id || !params.scope || !params.state || !params.redirect_uri){
			ctx.status = 403;
			return;
		}
		var clientId = params.client_id,
			state = params.state,
			redirect_uri = params.redirect_uri,
			client;

		client = registry.findClient(clientId);

		if(!client || client.redirectUris.indexOf(redirect_uri) < 0){
			ctx.status = 403;
			return;
		}

		redirect(ctx, redirect_uri, {
			state: state,
			error: error || 'unknown'
		});
	}

	function logoutUser(ctx){
		ctx.session.loginUser = null;
	}

	function composeUri(uri, query){
		var f, s, arr;

		arr = [];

		for(f in query){
			if(typeof query.hasOwnProperty != 'function' || query.hasOwnProperty(f)){
				arr.push(`${f}=${encodeURIComponent(query[f])}`);
			}
		}

		s = arr.join('&');

		if(s && !/\?$/.test(uri)){
			s = '?'+s;
		}

		return `${uri}${s}`;
	}


		return router;
	}

module.exports = AuthRouter;
