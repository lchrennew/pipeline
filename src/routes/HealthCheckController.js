import Controller from './Controller';

class HealthCheckController extends Controller {
    constructor(config) {
        super(config);
        this.logger = config.getLogger('HealthCheckController.js');

        this.get('/', ctx => {
            try {
                // DO some db query
                ctx.body = { health: 'GOOD' }
            } catch (e) {
                this.logger.error('Could not select from features, error was: ', e);
                ctx.status = 500
                ctx.body = { health: 'BAD' }
            }
        });
    }
}

export default HealthCheckController;
