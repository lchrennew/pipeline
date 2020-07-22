import EventStore from '../../domains/Event.store';
import Controller from '../Controller';

export default class PipelineController extends Controller {

    constructor(config, eventStore: EventStore) {
        super(config);

        this.eventStore = eventStore

        this.post('/exec/:id/sync', this.sync)
    }

    eventStore: EventStore
    executionStore

    async sync(ctx) {
        await this.eventStore.store({})
        ctx.status = 201
    }
}
