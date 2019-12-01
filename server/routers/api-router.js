const Router = require('koa-router');

const keywordRouter = require('./keyword-router');
const noteRouter = require('./note-router');

const appConfig = require('../config/app-conf');
const prefix = '/api';

function APIRouter(app){
	var router = new Router({ 'prefix': prefix });

	//...
	router.use(app.oauth.authenticate());
	router.use(handleAuthenticateError());

	router.get('/getUser', getUser);
	router.use(keywordRouter(app, { 'prefix': '/keyword', 'config': appConfig }).routes());
	router.use(noteRouter(app, { 'prefix': '/note', 'config': appConfig }).routes());

	return router;
}

function handleAuthenticateError(){
	return async (ctx, next) => {
		var oauthInfo = ctx.state.oauth || {},
			{ error, token } = oauthInfo;

		if(error){
			console.error(error);
			return ctx.status = error.code;
		}

		if(!token){
			return ctx.status = 401;
		}

		ctx.state.loginUser = token.user;

		await next();
	};
}

async function getUser(ctx, next){
	if(!ctx.state.loginUser){
		ctx.status = 401;
		return;
	}

	ctx.body = {
		'success': true,
		'result': Object.assign({}, ctx.state.loginUser)
	};
}

module.exports = APIRouter;
