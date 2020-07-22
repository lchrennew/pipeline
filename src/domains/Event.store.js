import { EventEmitter } from 'events';
import { asArray } from '../utils/constants';
import mongo from '../utils/mongo';

const TABLE = 'events'

class EventStore extends EventEmitter {
    constructor() {
        super();
    }

    async store(event) {
        const { type, creator, data } = event
        const { insertedId } = await mongo(async db => await db.collection(TABLE).insertOne({ type, creator, data }))
        event._id = insertedId
        return this.emit(type, event)
    }

    async getEvents() {
        return await mongo(
            async db => await db.collection(TABLE)
                .find(
                    {},
                    { limit: 100, sort: { createdAt: -1 } }),
            { asArray })
    }

    async getEventsFilterByName(name) {
        return await mongo(
            async db =>
                await db.collection(TABLE)
                    .find(
                        { 'data.name': name },
                        { limit: 100, sort: { createdAt: -1 } }),
            { asArray })
    }
}

export default EventStore;
