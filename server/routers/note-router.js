const Router = require('koa-router');

const appConfig = require('../config/app-conf');
const mqw = require('../security/utils/mal-request-validation-wrapper');
const noteController = require('../controllers/note-controller').getInstance();

module.exports = getNoteRouter;

function getNoteRouter(app, options={}){
    options = Object.assign({
        'config': appConfig,
        'prefix': ''
    }, options);

    var noteRouter = new Router({ 'prefix': options.prefix });

    noteRouter.get('/findById', mqw(noteController.findNoteById));
	noteRouter.get('/delete', mqw(noteController.deleteNote));
	noteRouter.post('/add', mqw(noteController.addNote));
	noteRouter.post('/update', mqw(noteController.updateNote));
	noteRouter.post('/search', mqw(noteController.searchNotes));
	noteRouter.post('/findByMark', mqw(noteController.findByMark));
    noteRouter.get('/count', mqw(noteController.countNotes));

    return noteRouter;
}