 "use strict";

//put this middleware in the stack following the session middleware
const defaultConfig = {
	blockDuration: 30 * 60 * 1000,
	triesThreshold: 5,
	clearCountInterval: 5 * 60 * 1000,
	topics: [],
	pathTopicMap: {}
};

const ONE_DAY = 1000 * 60 * 60 * 24,
	  HALF_DAY = Math.floor(ONE_DAY / 2);

module.exports = (config, callback) => {
	const conf = Object.assign({}, defaultConfig, config);

	conf.topics = (conf.topics || []).map(tp => {
		if(typeof tp == 'string'){
			return {
				name: tp,
				triesThreshold: conf.triesThreshold,
				blockDuration: conf.blockDuration,
				clearCountInterval: conf.clearCountInterval
			};
		}else if(typeof tp == 'object' && typeof tp.name == 'string'){
			return tp;
		}
		return false;
	}).filter(Boolean);

	return async (ctx, next) => {

		var sess = ctx.session,
			t = new Date().getTime(),
			b, blocked, topic, path;

		path = ctx.request.path;

		if(!sess.malAccessBlocker){
			sess.malAccessBlocker = {};
			(conf.topics || []).forEach(tp => sess.malAccessBlocker[tp.name] = {
				blocked: false,
				lastBlockTime: 0,
				lastTryTime: 0,
				triesThreshold: tp.triesThreshold,
				blockDuration: tp.blockDuration,
				clearCountInterval: tp.clearCountInterval,
				count: 0,
				since: t,
				blockTimes: 0
			});
		}

		b = sess.malAccessBlocker;

		topic = conf.pathTopicMap[path];

		if(topic && (topic = b[topic])){
			if(topic.blocked){
				if(t - topic.lastBlockTime > topic.blockDuration){
					topic.blocked = false;
					topic.count = 0;
					topic.lastTryTime = 0;
					//增加下次罚时
					topic.blockDuration = Math.min(ONE_DAY, topic.blockDuration + Math.floor(topic.blockDuration / 2));
					//增加清除计数器的时间间隔
					topic.clearCountInterval = Math.min(HALF_DAY, topic.clearCountInterval + Math.floor(topic.clearCountInterval / 2));
				}else{
					blocked = true;
				}
			}else if(t - topic.lastTryTime > topic.clearCountInterval){
				topic.count = 0;
			}
		}

		if(topic && blocked){
			ctx.status = 403;
			invokeCallback(callback, topic, ctx);
			return;
		}

		await next();

		t = new Date().getTime();

		if(topic && ctx.request.malRequest){
			topic.count += 1;
			topic.lastTryTime = t;
			if(topic.count >= topic.triesThreshold){
				blocked = true;
				topic.blocked = true;
				topic.lastBlockTime = t;
				topic.blockTimes += 1;
			}
		}

		if(topic && blocked){
			ctx.status = 403;
			invokeCallback(callback, topic, ctx);
			return;
		}
	};
};


function invokeCallback(callback, topic, ctx){
	if(typeof callback == 'function'){
		process.nextTick(() => {
			//外部可通过回调来在请求被拒绝时记录日志或者进行其他操作
			var req = {};
			['origin', 'url', 'method', 'ip', 'ips'].forEach(f => req[f] = ctx.request[f]);
			callback(Object.assign({}, topic), { 'request': req });
		});
	}
}
