import { register as prometheusRegister } from 'prom-client';

import Controller from './controller';

class BackstageController extends Controller {
    constructor(config) {
        super(config)

        if (config.serverMetrics) {
            this.get('/prometheus', ctx => {
                ctx.type = prometheusRegister.contentType
                ctx.body = prometheusRegister.metrics()
            })
        }
    }
}

export default BackstageController;
