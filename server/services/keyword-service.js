"use strict";

const KeywordStore = require('../persist/keyword-store'),
	  NoteStore = require('../persist/note-store'),
	  timeUtils = require('../utils/time-utils'),
	  urlUtils = require('../utils/url-utils'),
	  reUtils = require('regex-utils');

const store = {
	keyword: KeywordStore.newInstance(),
	note: NoteStore.newInstance()
};

module.exports = KeywordService;

function KeywordService(){
	var self = this;

	if(!(self instanceof KeywordService)){
		return new KeywordService();
	}

	return self;
}

KeywordService.prototype.addKeyword = async function(keyword, loginUser){
	if(!loginUser || !loginUser.username){
		return false;
	}

	var rs;

	keyword.username = keyword.username || loginUser.username;

	if(keyword.username != loginUser.username){
		return false;
	}

	if(!keyword.noteIds){
		keyword.noteIds = [];
	}

	keyword.createTime = new Date();
	keyword.keyword = keyword.keyword.trim();
	keyword.lastUpdateTime = new Date(keyword.createTime.getTime());

	rs = await store.keyword.save(keyword);

	if(!rs){
		return false;
	}

	return rs;
};

KeywordService.prototype.updateKeyword = async function(keyword, loginUser){
	if(!keyword || !loginUser || !loginUser.username){
		return false;
	}

	var self = this,
		rs, update;

	keyword.username = keyword.username || loginUser.username;

	if(keyword.username != loginUser.username){
		return false;
	}

	update = Object.assign({}, keyword);

	update.lastUpdateTime = new Date();

	delete update._id;
	delete update.keyword;
	delete update.createTime;

	rs = await store.keyword.update({ _id: keyword._id, username: loginUser.username });

	if(!rs){
		return false;
	}

	return await self.findKeywordById(keyword._id, loginUser);
};

KeywordService.prototype.deleteKeyword = async function(_id, loginUser){
	if(!_id || !loginUser || !loginUser.username){
		return false;
	}

	var rs;

	rs = await store.keyword.delete({ _id: _id, username: loginUser.username });

	if(!rs){
		return false;
	}

	return true;
};

KeywordService.prototype.findKeywordById = async function(_id, loginUser){
	if(!loginUser || !loginUser.username){
		return false;
	}

	var rs;

	if(!rs || !rs.length){
		return null;
	}

	return rs[0] || null;
};

KeywordService.prototype.listKeywords = async function(query, opts, loginUser){
	if(!loginUser || !loginUser.username){
		return false;
	}

	var rs;

	query = query || {};
	opts = opts || {};

	query.username = query.username || loginUser.username;

	if(query.username != loginUser.username){
		return false;
	}

	if(!opts.pagination){
		opts.pagination = {
			pageNo: 1,
			pageSize: 20
		};
	}

	opts.pagination.pageSize = Math.min(opts.pagination.pageSize, 100);

	rs = await store.keyword.find(query, opts, 'toArray');

	if(rs){
		return rs;
	}

	return false;
};

KeywordService.prototype.searchKeywords = async function (params, loginUser){
	if(!loginUser || !loginUser.username){
		return false;
	}

	var rs, q, query, opts, tot;

	q = params.query || {};

	q.username = q.username || loginUser.username;

	if(q.username != loginUser.username){
		return false;
	}

	q.searchStr = (q.searchStr || '').trim();

	query = {};
	opts = {};

	if(q._id){
		if(Array.isArray(q._id)){
			query._id = { $in: q._id };
		}else{
			query._id = q._id;
		}
	}

	if(q.keyword && q.keyword.trim()){
		query.keyword = q.keyword;
	}else if(q.searchStr){
		query.keyword = {
			$contains: q.searchStr, $opts: { ignoreCases: true }
		};
	}

	if(q.createTimeStart){
		let d = timeUtils.getDayDateFromMills(q.createTimeStart);
		if(d){
			query.createTime = {};
			query.createTime.$gte = d;
		}
	}
	if(q.createTimeEnd){
		let d = timeUtils.getDayDateFromMills(q.createTimeEnd, 'dateEnd');
		if(d){
			query.createTime = query.createTime || {};
			query.createTime.$lte = d;
		}
	}

	if(q.lastUpdateTimeStart){
		let d = timeUtils.getDayDateFromMills(q.lastUpdateTimeStart);
		if(d){
			query.lastUpdateTime = {};
			query.lastUpdateTime.$gte = d;
		}
	}
	if(q.lastUpdateTimeEnd){
		let d = timeUtils.getDayDateFromMills(q.lastUpdateTimeEnd);
		if(d){
			query.lastUpdateTime = query.lastUpdateTime || {};
			query.lastUpdateTime.$lte = d;
		}
	}

	query.username = q.username;

	if(!params.sort){
		opts.sort = [];
	}else{
		opts.sort = [].concat(params.sort).filter(Boolean);
	}

	if(!opts.sort.some(f => f.length && f[0] == 'lastUpdateTime')){
		opts.sort.push([ 'lastUpdateTime', -1 ]);
	}

	if(!params.pagination){
		opts.pagination = {
			pageNo: 1,
			pageSize: 20
		};
	}else{
		opts.pagination = Object.assign({}, params.pagination);
	}

	opts.pagination.pageSize = Math.min(opts.pagination.pageSize, 100);

	tot = await store.keyword.count(query);

	if(tot < (opts.pagination.pageNo - 1) * opts.pagination.pageSize){
		opts.pagination.pageNo = Math.floor(tot / opts.pagination.pageSize) + 1;
	}

	opts.project = params.project;

	rs = await store.keyword.find(query, opts, 'toArray');

	if(rs){
		rs = {
			result: rs,
			totalCount: tot,
			pagination: { pageNo: opts.pagination.pageNo, pageSize: opts.pagination.pageSize }
		};
	}

	return rs || false;
};

KeywordService.prototype.checkExist = async (keyword, loginUser) => {
	if(!loginUser || !loginUser.username){
		return false;
	}

	return (await store.keyword.count({
		keyword: keyword,
		username: loginUser.username
	}) > 0);
}

KeywordService.prototype.getSuggestions = async (params, loginUser) => {
	if(!loginUser || !loginUser.username){
		return false;
	}

	var relatedNotes, cands, text, t, ws, m;

	t = new Date();

	t = new Date(t.getTime() - 1000 * 60 * 30);

	relatedNotes = await store.note.find({
		username: loginUser.username,
		$or: [
			{ url: urlUtils.normalizeUrl(params.url) },
			{ lastUpdateTime: { $gte: t } }
		]
	}, {
		project: { keywordNames: true },
		pagination: { pageNo: 1, pageSize: 20 }
	}, 'toArray');

	cands = [];

	if(relatedNotes && relatedNotes.length){
		cands = cands.concat(relatedNotes.map(n => (n.keywordNames || '').split(','))
			.reduce((a, b) => a.concat(b)));
	}

	if(params.cands){
		cands = cands.concat(params.cands);
	}

	text = '';

	if(params.pageTitle){
		text += ' ' + params.pageTitle;
	}

	if(params.text){
		text += ' ' + params.text;
	}

	text = text.replace(/(\s[:\-\.,。，@#%\(\)（）=_\[\]\{\}]\s|\s+)/g, ' ').replace(/[\/\\\.:'"‘“,。，#%\(\)（）=_\[\]\{\}@]+/g, ' ').replace(/\s+/g, ' ');
	
	ws = dedup(text.split(/\s+/)
			.map(o => o.toLowerCase()))
			.filter(o => 
					o && o.length > 2 &&
					!/^[0-9]*$/.test(o) &&
					!/^(what|why|where|when|which|a|in|yes|no|on|at|is|are|was|were|he|she|it|her|its|是|的)$/.test(o));

	cands = cands.filter(o => ws.indexOf(o) >= 0).splice(0, 2);

	if(cands.length > 0){
		return { result: cands };
	}

	m = store.keyword.find({
		keyword: { $in: ws.map(s => RegExp("/^"+reUtils.contains(s)+"$/i")) },
		username: loginUser.username
	}, { keyword: 1 }, 'toArray');

	if(m && m.length){
		return {
			result: m.map(o => o.keyword)		
		};
	}

	return {
		result: [].concat(cands)
	};
};

function dedup(arr){
	var m = {},
		newArr = [];

	arr.forEach(o => {
		if(!m[o]){
			newArr.push(o);
			m[o] = 1;
		}else{
			m[o] ++;
		}
	});

	return newArr;
}