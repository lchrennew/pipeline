import merge from 'deepmerge';
import { readFileSync } from 'fs';
import { defaultLogProvider, validateLogProvider } from './logger';

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

function defaultDatabaseUrl() {
    if (process.env.DATABASE_URL_FILE) {
        return readFileSync(process.env.DATABASE_URL_FILE, 'utf8');
    }
    if (process.env.DATABASE_URL) {
        return process.env.DATABASE_URL;
    }
    return undefined;
}

function defaultOptions() {
    return {
        databaseUrl: defaultDatabaseUrl(),
        port: process.env.HTTP_PORT || process.env.PORT || 4242,
        host: process.env.HTTP_HOST,
        pipe: undefined,
        baseUriPath: process.env.BASE_URI_PATH || '',
        serverMetrics: true,
        extendedPermissions: false,
        enableRequestLogger: false,
        sessionAge: THIRTY_DAYS,
        adminAuthentication: 'unsecure',
        ui: {},
        importFile: undefined,
        dropBeforeImport: false,
        getLogger: defaultLogProvider,
        disableDBMigration: false,
        start: true,
        queueServerUri: process.env.QUEUE_SERVER_URI
    };
}

export const createOptions = (opts = {}) => {
    const options = merge(defaultOptions(), opts);

    options.listen = options.pipe
        ? { path: options.pipe }
        : { port: options.port, host: options.host };

    validateLogProvider(options.getLogger);

    return options;
}
