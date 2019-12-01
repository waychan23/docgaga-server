const oauth2Clients = require('./runtime-conf').oauth2Clients;

const SCOPE_NOTHING = 'nothing',
	  SCOPE_NOTE_READ_WRITE = 's_n_rw',
	  SCOPE_KEYWORD_READ_WRITE = 's_k_rw',
	  SCOPE_USER_PROFILE_READ = 's_u_r';
	  
const PRIVI_USER_PROFILE_READ = { id: 'p_u_r', name: '查看用户基本信息(用户名、头像)', order: 0 },
	  PRIVI_NOTE_READ = { id: 'p_n_r', name: '查看笔记', order: 1 },
	  PRIVI_NOTE_WRITE = { id: 'p_n_w', name: '添加、修改、删除笔记', order: 2 },
	  PRIVI_KEYWORD_READ = { id: 'p_k_r', name: '查看关键词', order: 3 },
	  PRIVI_KEYWORD_WRITE = { id: 'p_k_w', name: '添加、修改、删除关键词', order: 4 };

const services = [],
	  scopes = {};

scopes[SCOPE_NOTHING] = { 
	id: SCOPE_NOTHING,
	privileges: []
};

scopes[SCOPE_USER_PROFILE_READ] = {
	id: SCOPE_USER_PROFILE_READ,
	privileges: [ PRIVI_USER_PROFILE_READ ]	
};

scopes[SCOPE_KEYWORD_READ_WRITE] = {
	id: SCOPE_KEYWORD_READ_WRITE,
	privileges: [ PRIVI_KEYWORD_READ, PRIVI_KEYWORD_WRITE ],
	dependencies: [ scopes[SCOPE_USER_PROFILE_READ] ]
};

scopes[SCOPE_NOTE_READ_WRITE] = {
	id: SCOPE_NOTE_READ_WRITE,
	privileges: [ PRIVI_NOTE_READ, PRIVI_NOTE_WRITE ],
	dependencies: [ scopes[SCOPE_USER_PROFILE_READ], scopes[SCOPE_KEYWORD_READ_WRITE] ]
};

oauth2Clients.forEach(client => registerService(client));

function registerService(service){
	if(services.some(s => s.clientId == service.clientId)){
		console.warn("Ignore: duplicate service attempting to register: ", service.clientId);
	}else{
		if(service.scopes && service.scopes.length){
			service.scopeMap = {};
			service.scopes.forEach(s => service.scopeMap[s] = scopes[s]);
		}
		services.push(service);
	}
}

function findClient(clientId, clientSecret){
	if(!clientId){
		console.warn('clientId is empty');
		return null;
	}

	var verifySecret = typeof clientSecret != 'undefined' && clientSecret !== null,
		found = services.filter(
			s =>
				s.clientId == clientId &&
				(!verifySecret || s.clientSecret == clientSecret)
		);

	return (found.length && found.pop()) || null;
}

function getScopePrivilieges(scope){
	if(!scope){
		return [];
	}
	var privis = flatAndDedup(scope.split(',').map(s => s.trim()).filter(Boolean)
					.map(id => scopes[id]).filter(Boolean), 'id', 'dependencies')
					.map(s => s.privileges || [])
					.reduce((rs, item) => rs.concat(item));
	return privis.sort((a, b) => a.order - b.order);
}

function validateScope(clientId, scope){
	if(!clientId || !scope){
		console.warn('clientId or scope is empty');
		return false;
	}

	var client = findClient(clientId),
		allowedScps,
		scps, m;

	if(!client || !client.scopeMap){
		return false;
	}

	allowedScps = flatAndDedup(client.scopeMap, 'id', 'dependencies');
	allowedScps = arrToMap(allowedScps, 'id');

	scps = scope.split(',').map(s => s.trim()).filter(Boolean);

	if(!scps.length){
		return false;
	}

	if(scps.some(s => !allowedScps[s])){
		return false;
	}

	return scps.join(',');
}

function flatAndDedup(data, idKey, depKey){
	var arr, rs, m;

	if(typeof data == 'object'){
		arr = [];
		for(let f in data){
			if(data.hasOwnProperty(f)){
				arr.push(data[f]);
			}
		}
	}else if(Array.isArray(data)){
		arr = data;
	}else{
		throw "parameter 'data' must be an object or array";
	}

	rs = [];
	m = {};

	arr.filter(Boolean).forEach(i => {
		let id = idKey? i[idKey]: i,
			deps;

		if(!m[id]){
			m[id] = i;
			rs.push(i);
			deps = depKey && i[depKey];
			if(deps && typeof deps == 'object' || Array.isArray(deps)){
				rs = rs.concat(flatAndDedup(deps, idKey, depKey));
			}
		}
	});

	return dedup(rs, idKey);
}

function arrToMap(arr, idKey){
	var m = {};

	arr.forEach(i => m[i[idKey]] = i);

	return m;
}

function dedup(arr, idKey){
	var m = {},
		rs = [];

	arr = arr || [];

	arr.filter(Boolean).forEach(i => {
		let id = idKey? i[idKey]: i;
		if(!m[id]){
			m[id] = i;
			rs.push(i);
		}
	});

	return rs;
}

module.exports = {
	'scopes': scopes,
	'services': services,
	'findClient': findClient,
	'getScopePrivileges': getScopePrivilieges,
	'validateScope': validateScope
};
