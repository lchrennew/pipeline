import { MongoClient } from 'mongodb';

let client: MongoClient = null;

export default async function mongo(handler, options = { asArray: false, dbName: undefined }) {
    const { asArray = false, dbName = undefined } = options

    if (!client) {
        client = new MongoClient(process.env.DATABASE_URL ?? 'mongodb://127.0.0.1:27017/unleash', { useUnifiedTopology: true });
    }
    if (!client.isConnected())
        await client.connect();
    let result = null;
    if (handler) {
        result = await handler(dbName ? client.db(dbName) : client.db(), client);
        asArray && (result = await result?.toArray());
    }
    return result
}
