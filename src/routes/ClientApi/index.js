import Controller from '../Controller';
import apiDef from './ApiDef.json';
import PipelineController from './PipelineController';

export default class AdminApi extends Controller {
    constructor(config) {
        super(config);
        this.get('/', this.index)
        this.use('/pipe', new PipelineController(config))
    }

    index(ctx) {
        ctx.body = apiDef
    }
}
