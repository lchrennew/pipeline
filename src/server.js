// import crypto from 'crypto'
import { EventEmitter } from 'events';
import { up } from './migrations';
import getApp from './app';
import { createStores } from './createStores';
import { addEventHook } from './events/eventHook';
import { startMonitoring } from './metrics';
import { createOptions } from './options';

export AuthenticationRequired from './AuthenticationRequired';
export permissions from './permissions';
export User from './User';

async function createApp(options) {
    // Database dependencies (stateful)
    const logger = options.getLogger('server.js');
    const eventBus = new EventEmitter();
    const stores = createStores(options, eventBus);
    const secret = await stores.settingStore.get('unleash.secret');

    const config = {
        stores,
        eventBus,
        secret,
        ...options,
    };

    const app = getApp(config);
    startMonitoring(
        options.serverMetrics,
        eventBus,

    );

    if (typeof config.eventHook === 'function') {
        addEventHook(config.eventHook, stores.eventStore);
    }

    return new Promise((resolve, reject) => {
        const payload = {
            app,
            config,
            stores,
            eventBus,
        };

        if (options.start) {
            const server = app.listen(options.listen, () =>
                logger.info('Pipeline has started.', server.address()),
            );
            server.on('listening', () => {
                resolve({ ...payload, server });
            });
            server.on('error', reject);
        } else {
            resolve({ ...payload });
        }
    });
}

export async function start(opts) {
    const options = createOptions(opts);
    const logger = options.getLogger('server.js');

    try {
        if (options.disableDBMigration) {
            logger.info('DB migrations disabled');
        } else {
            await up(options);
        }
    } catch (err) {
        logger.error('Failed to migrate db', err);
        throw err;
    }

    return await createApp(options);
}

export async function create(opts) {
    return start({ ...opts, start: false });
}
