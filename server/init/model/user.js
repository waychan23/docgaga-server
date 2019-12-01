"use strict";

var indexes = [
	{ spec: { username: 1 }, options: { unique: true } },
	{ spec: { email: 1 }, options: { unique: true, sparse: true } },
	{ spec: { phone: 1 }, options: { unique: true, sparse: true } },
	{ spec: { createTime: -1 } },
	{ spec: { blocked: 1 }, options: { sparse: true } },
	{ spec: { verified: 1 }, options: { sparse: true } }
];

module.exports = {
	name: 'docgagauser',
	indexes: indexes,
	createOptions: {}
};
