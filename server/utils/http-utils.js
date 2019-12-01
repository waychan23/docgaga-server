"use strict";

const http = require('http');
const https = require('https');

module.exports = {
	http: makeAgent(http),
	https: makeAgent(https)
};

function makeAgent(protocol){
	return function(method, req){
		var headers = req.headers || {},
			params = req.params || {},
			body = req.body || '',
			host = req.host,
			port = req.port || (protocol === http? 80: 443),
			path = req.path || '/',
			encoding = req.encoding || 'utf-8',
			reqParams;

		method = method.toUpperCase();

		reqParams = {
			hostname: host,
			path: path,
			headers: headers,
			method: method,
			port: port
		};

		if(!(method == 'GET' || method == 'POST')){
			throw `unsupported HTTP METHOD '${method}'`;
		}

		if(protocol === https){
			reqParams.rejectUnauthorized = false;
		}

		return new Promise((resolve, reject) => {
			var out = protocol.request(reqParams, (res) => {
				var rsBody = '',
					contentType = res.headers['content-type'];

				res.setEncoding('utf-8');

				res.on('data', (chunk) => {
					rsBody += chunk;
				});

				res.on('end', () => {
					var rs;

					if(/json/.test(contentType)){
						try{
							rs = JSON.parse(rsBody);
						}catch(e){
							reject(e);
						}
					}else{
						rs = rsBody;
					}
					
					resolve(rs);
				});

				res.on('error', (err) => {
					reject(err);
				});
			});

			if(body){
				out.write(body, encoding || 'utf-8');
			}

			out.end();
		});
	};
}
