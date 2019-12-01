"use strict";

var indexes = [
	{ spec: { username: 1 }, options: { sparse: true } },
	{ spec: { url: 1 }, options: { sparse: true } },
	{ spec: { pageTitle: 1 }, options: { sparse: true } },
	{ spec: { noteType: 1 }, options: { sparse: true } },
	{ spec: { startPath: 1 }, options: { sparse: true } },
	{ spec: { endPath: 1 }, options: { sparse: true } },
	{ spec: { createTime: -1 }, options: { sparse: true } },
	{ spec: { lastUpdateTime: -1 }, options: { sparse: true } },
	{ spec: { keywords: 1 }, options: { sparse: true} },
	{ spec: { keywordNames: 1 }, options: { sparse: true } }
];

module.exports = {
	name: 'docgaganote',
	indexes: indexes,
	createOptions: {}
};
