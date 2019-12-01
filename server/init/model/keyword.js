"use strict";

var indexes = [
	{ spec: { username: 1 }, options: { sparse: true } },
	{ spec: { keyword: 1 }, options: { sparse: true } },
	{ spec: { createTime: -1 }, options: { sparse: true } },
	{ spec: { username: 1, keyword: 1 }, options: { unique: true, sparse: true } },
	{ spec: { lastUpdateTime: -1 }, options: { sparse: true } }
];

module.exports = {
	name: 'docgagakeyword',
	indexes: indexes,
	'createOptions': {}
};
