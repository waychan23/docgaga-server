"use strict";

const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const compress = require('koa-compress');
const zlib = require('zlib');
const mount = require('koa-mount');
const staticServer = require('koa-static');
const malAccessBlocker = require('./security/middleware/mal-access-blocker');
const mqw = require('./security/utils/mal-request-validation-wrapper');
const requestFrequencyController = require('./security/middleware/request-frequency-controller');
const authController = require('./security/middleware/auth-controller');
const validator = require('./validation/middleware/validator');

const appConfig = require('./config/app-conf');

const validationConfig = require('./config/validation-conf');

const session = require('./session/session-conf');

const authRouter = require('./routers/auth-router');
const oauthRouter = require('./routers/oauth-router');
const apiRouter = require('./routers/api-router');

module.exports.listen = function(port){
	const userController = require('./controllers/user-controller')();

	const app = new Koa();

	const rootRouter = new Router({
		'prefix': appConfig.contextPath
	});

	const router = new Router({
		'prefix': ''
	});

	const userRouter = new Router({
		'prefix': '/user'
	});

	//配置路由 userRouter
	userRouter.get('/signup/checkUserAvail', mqw(userController.checkUserAvail));
	userRouter.get('/signup/sendPhoneVerifyCode', mqw(userController.sendPhoneVerifyCode));
	userRouter.post('/signup/submit', mqw(userController.signUp));
	userRouter.get('/reset-password/sendPhoneVerifyCode', mqw(userController.sendPhoneVerifyCodeForResetPassword));	
	userRouter.get('/reset-password/verifyCode', mqw(userController.verifyPhoneVerifyCodeForResetPassword));
	userRouter.post('/reset-password/resetPassword', mqw(userController.resetPassword));
	rootRouter.use(authRouter(app).routes());
	rootRouter.use(oauthRouter(app).routes());

	//挂载用户认证中间件
	rootRouter.use(authController());

	//挂载请求频率控制中间件
	rootRouter.use(requestFrequencyController({
		'requestTab': {
			'/docgaga/user/signup/submit': { 'minInterval': 5 * 1000 },
			'/docgaga/user/signup/sendPhoneVerifyCode': { 'minInterval': 60 * 1000 },
			'/docgaga/user/reset-password/sendPhoneVerifyCode': { 'minInterval': 30 * 1000 },
			'/docgaga/user/reset-password/verifyCode': { 'minInterval': 5 * 1000 },
			'/docgaga/user/reset-password/resetPassword': { 'minInterval': 5 * 1000 },
			'/docgaga/auth': { 'minInterval': 5 * 1000 }
		}
	}));

	//挂载恶意请求拦截中间件
	rootRouter.use(malAccessBlocker({
		'triesThreshold': 60,
		'clearCountInterval': 60 * 1000,
		'topics': [
			'resetPassword', 'verifyPhoneVerifyCode', 'sendPhoneVerifyCode', 'submitSignup', 'login'
		],
		'pathTopicMap': {
			'/docgaga/user/reset-password/resetPassword': 'resetPassword',
			'/docgaga/user/reset-password/sendPhoneVerifyCode': 'sendPhoneVerifyCode',
			'/docgaga/user/reset-password/verifyCode': 'verifyPhoneVerifyCode',
			'/docgaga/user/signup/sendPhoneVerifyCode': 'sendPhoneVerifyCode',
			'/docgaga/user/signup/submit': 'submitSignup',
			'/docgaga/auth': 'login'
		}
	}, (topic, ctx) => {
		console.log(ctx);
		console.log('[BLOCKED MAL ACCESS]{ topic: ', topic , ', request: ', ctx.request, '}');
	}));

	//挂载请求数据验证中间件
	rootRouter.use(validator(validationConfig));

	//挂载业务内容服务
	rootRouter.use(router.routes());
	rootRouter.use(userRouter.routes());
	rootRouter.use(apiRouter(app).routes());

	//挂载静态内容服务
	app.use(mount(`${appConfig.assetsPath}`, staticServer(`${__dirname}/../assets/build`)));

	//挂载会话管理中间件
	app.use(session(app));
	app.use(async (ctx, next) => { ctx.request.session = ctx.session; await next(); });

	//挂载请求体解析中间件
	app.use(bodyParser({
		'onerror': (err, ctx) => {
			ctx.throw('请求解析失败', 422);
		}
	}));

	app.use(rootRouter.routes());
	//响应内容压缩
	app.use(compress({
		'filter': function(contentType){
			return true;
		},
		'threshold': 1024,
		'flush': zlib.constants.Z_SYNC_FLUSH
	}));

	app.listen(port, function(){
		console.log(`汤圆笔记认证与资源服务器启动成功，端口：${port}`);
	});
}