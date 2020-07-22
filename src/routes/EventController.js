import eventDiffer from '../events/eventDiffer';
import Controller from './controller';

const version = 1;

class EventController extends Controller {
    constructor(config) {
        super(config);
        this.eventStore = config.stores.eventStore;
        this.get('/', this.getEvents);
    }

    async getEvents(ctx, next) {
        const events = await this.eventStore.getEvents();
        eventDiffer.addDiffs(events);
        ctx.body = { version, events }
        await next()
    }
}

export default EventController;
