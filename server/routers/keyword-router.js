const Router = require('koa-router');

const appConfig = require('../config/app-conf');
const mqw = require('../security/utils/mal-request-validation-wrapper');
const keywordController = require('../controllers/keyword-controller').getInstance();

module.exports = getKeywordRouter;

function getKeywordRouter(app, options={}){

    options = Object.assign({
        config: appConfig,
        prefix: ''
    }, options);

    var keywordRouter = new Router({ prefix: options.prefix });

    keywordRouter.get('/findById', mqw(keywordController.findKeywordById));
	keywordRouter.post('/add', mqw(keywordController.addKeyword));
	keywordRouter.post('/search', mqw(keywordController.searchKeywords));
	keywordRouter.post('/getSuggestions', mqw(keywordController.getSuggestions))

    return keywordRouter;
}