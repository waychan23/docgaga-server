"use strict";

const UserStore = require('../../persist/user-store'),
	  timeUtils = require('../../utils/time-utils');

const store = {
	user: new UserStore()
};

const defaultConfig = {
	'authHeaders': {
		'username': 'x-username',
		'apiTicket': 'x-api-ticket',
		'ua': 'user-agent'
	},
	'userInfoField': 'loginUser'
};

module.exports = (opts) => {
	opts = opts || {};

	Object.assign(opts, defaultConfig);

	return async (ctx, next) => {
		var sess = ctx.session,
			headers, user, found, ua, t, et, apiTicket;

		if(sess.loginUser){
			return await next();
		}

		headers = {};

		headers.username = ctx.get(opts.authHeaders.username);
		headers.apiTicket = ctx.get(opts.authHeaders.apiTicket);
		headers.ua = ctx.get(opts.authHeaders.ua);

		if(!headers.username || !headers.apiTicket || !headers.ua){
			return await next();
		}

		t = new Date();
		et = new Date(t.getTime() - timeUtils.MILLIS.ONE_MONTH);

		user = await store.user.find(
			{
				username: headers.username,
				apiTickets: {
					$elemMatch: {
						apiTicket: headers.apiTicket,
						lastUseTime: { $gt: et }
					}
				}
			},
			{
				project: {
					username: 1,
					apiTickets: {
						$elemMatch: {
							apiTicket: headers.apiTicket
						}
					}
				}
			},
			'toArray'
		);

		if(!user || !user.length || !user[0].apiTickets || !user[0].apiTickets.length){
			return await next();
		}

		user = user[0];

		apiTicket = user.apiTickets[0];

		if(apiTicket.lastUseTime && (t.getTime() - apiTicket.lastUseTime.getTime()) > timeUtils.MILLIS.ONE_HOUR){
			await store.user.update({
				_id: user._id,
				'apiTickets.apiTicket': headers.apiTicket
			}, {
				$set: { 'apiTickets.$.lastUseTime': t }
			});
		}
		
		sess.loginUser = { username: user.username, apiTicket: headers.apiTicket };

		return await next();
	};
};
