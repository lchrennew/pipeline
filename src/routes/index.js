import AdminApi from './AdminApi';
import BackstageController from './BackstageController.js';
import ClientApi from './ClientApi'
import Controller from './Controller';
import EventController from './EventController';
import HealthCheckController from './HealthCheckController';


export default class IndexController extends Controller {
    constructor(config) {
        super(config);
        this.use('/health', new HealthCheckController(config))
        this.use('/internal-backstage', new BackstageController(config))
        this.use('/events', new EventController(config))
        this.use('/admin-api', new AdminApi(config))
        this.use('/client-api', new ClientApi(config))
    }
}
