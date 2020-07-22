/* eslint camelcase: "off" */

import mongo from '../utils/mongo';

const TABLE = 'settings';

class SettingStore {
    constructor(getLogger) {
        this.logger = getLogger('SettingsStore.js');
    }

    async updateRow(name, content) {
        return await mongo(
            async db => await db.collection(TABLE)
                .updateOne(
                    { name },
                    { $set: { content } },
                    { upsert: true }))
    }

    async insertNewRow(name, content) {
        return await mongo(
            async db => await db.collection(TABLE)
                .insertOne({ name, content }))
    }

    async upsert(name, content) {
        return await mongo(
            async db => await db.collection(TABLE)
                .updateOne(
                    { name },
                    { $set: { content } },
                    { upsert: true, }))
    }

    async get(name) {
        const result = await mongo(async db => db.collection(TABLE).findOne({ name }))
        return result?.content
    }
}

module.exports = SettingStore;
