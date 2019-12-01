"use strict";

var indexes = [
    { sepc: { token: 1, type: 1 }, options: { unique: true } },
    { spec: { expiresAt: 1 }, options: { expireAfterSeconds: 0 } },
    { spec: { type: 1 } },
    { spec: { user: 1 } },
    { spec: { scope: 1 } },
    { spec: { client: 1 } }
];

module.exports = {
	name: 'docgagaoauth',
	indexes: indexes,
	createOptions: {}
};
