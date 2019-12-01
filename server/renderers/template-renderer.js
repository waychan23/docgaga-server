const consolidate = require('consolidate');
const path = require('path');

function TemplateRender(options){
    options = options || {};

    options.basePath = options.basePath || path.resolve(__dirname, '..');
    options.ext = options.ext || 'html';
    options.views = options.views || {};

    function getPath(viewName){
        if(!viewName){
            return null;
        }
        if(options.views[viewName]){
            return path.resolve(options.views[viewName]);
        }
        return path.resolve(options.basePath, `${viewName}.${options.ext}`);
    };

    return async (ctx, next) => {
        var path, viewModel, rendered;
        if(ctx.state.viewName){
            path = getPath(ctx.state.viewName);
            if(path){
                if(typeof ctx.state.viewModel == 'object'){
                    viewModel = ctx.state.viewModel;
                }
                viewModel = viewModel || {};
                rendered = await consolidate.lodash(path, viewModel);
                ctx.body = rendered;
                return;
            }
            ctx.status = 404;
            return;
        }

        await next();
    };
}

module.exports = TemplateRender;