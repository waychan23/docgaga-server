/**
 * 该脚本用于清除:
 *  1) 任何过期的 token
 *  2) 那些过期超过2天仍没有被刷新的 refresh token，说明至少 2 天没有使用
 */

const MongoClient = require('mongodb').MongoClient;
const config = require('../config/mongodb-conf');

const COLLECTION = 'docgagaoauth';

const TWO_DAYS = 1000 * 60 * 60 * 24 * 2;

function c(){
    return MongoClient.connect(config.url, config.connectOptions);
}

function bootstrap(){
    Promise.resolve().then(() => {
        return clearRefreshTokens();
    }).catch((e) => {
        console.error(e);
    });
}

async function clearRefreshTokens(){
    var now = new Date(),
        t = new Date(Date.now() - TWO_DAYS),
        b, a;

    try{
        b = await c().then(count);

        await c().then(async h => {
            await h.collection(COLLECTION).deleteMany({ 
                $or: [
                        { expiresAt: { $lt: now } },
                        { type: 'r_t', _lastUpdateTime: { $lt: t } }
                    ]
            });
            h.close();
        });

        a = await c().then(count);

        console.log(`clear expired tokens - before: ${b}, after: ${a}, deleted: ${b - a}`);
    }catch(e){
        console.error(e);
    }
}

async function count(h){
    var rs = await h.collection(COLLECTION).count({});
    h.close();
    return rs;
}

bootstrap();