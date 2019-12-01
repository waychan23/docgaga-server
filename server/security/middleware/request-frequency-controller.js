"use strict";

module.exports = function(conf){
	var config = {
		'requestTab': {} 
	};

	Object.assign(config.requestTab, conf.requestTab);

	return async (ctx, next) => {
		var req = ctx.request,
			sess = ctx.session,
			path = req.path,
			t = new Date().getTime(),
			cnt, confItem;

		if(!sess){
			await next();
			return;
		}

		confItem = config.requestTab[path] || config.requestTab.$any;

		if(!confItem){
			await next();
			return;
		}

		cnt = sess.requestCounter = sess.requestCounter || {};

		if(!cnt[path]){
			cnt[path] = {
				lastRequestTime: 0
			};
		}

		if(t - cnt[path].lastRequestTime < confItem.minInterval){
			ctx.body = {
				'error': {
					'msg': '请求太频繁，请稍候再试'
				}
			};
			return;
		}

		await next();

		if(!ctx.request.skipCounting){
			cnt[path] = {
				lastRequestTime: t
			};
		}
	};
};

