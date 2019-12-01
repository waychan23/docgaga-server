"use strict";

const program = require('commander');
const client = require('mongodb').MongoClient;

program.version('0.0.1')
    .usage('[options]')
	.parse(process.argv);

var config = require('../config/mongodb-conf'), 
    prefixToRoot = '..';

console.log('init database');

function createDataBase(){
	var n;
	config.models.forEach(function(model){
		if(n){
			n = n.then(function(){
				return createIndexes(require(prefixToRoot+model.model));
			});
		}else{
			n = createIndexes(require(prefixToRoot+model.model));
		}
	});
}

function createIndexes(model){
	var conn;

	return client.connect(config.url, config.connectOptions).then(function(db){
		conn = db;
		console.log('db connected');
		new Promise(function(resolve, reject){
			db.collection(model.name, { strict: true }, function(err, coll){
				err && console.error('[ERROR] ', err.message);
				if(err && err.message.indexOf('not exist') > 0){
					console.log('model ', model.name, ' not exist yet');
					resolve('create');
					return;
				}
				resolve('do nothing');
			});
		}).then(function(command){
			console.log('command: ', command);
			if(command != 'create'){
				console.log(command, ' with model ', model.name);
				return false;
			}
			console.log(command, ' model ', model.name);
			return db.close().then(() => true);
		}).then(function(result){
			console.log(result);
			if(!result){
				return false;
			}
			return client.connect(config.url, config.connectOptions);
		}).then(function(db){
			if(!db){
				return false;
			}

			conn = db;
			return db.createCollection(model.name, model.createOptions || {});
		}).then(function(coll){
			if(!coll){
				return false;
			}

			console.log('creating indexes of model ', model.name, '...');
			var all = [];
			return Promise.all(model.indexes.map(i => coll.createIndex(i.spec, i.options || {})));
		}).then(function(result){
			console.log('creatation of indexes of model ', model.name, ' returns ', result);
			return conn.close();
		}).catch(function(err){
			console.error(err);
		});

	}).then(function(){
		return conn.close();
	}).catch(function(err){
		console.error(err);
		if(conn){
			conn.close();
		}
	});
}

createDataBase();
