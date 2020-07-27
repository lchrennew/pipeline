import EventStore from './domains/Event.store';
import ExecutionDb from './domains/ExecutionDb';
import ExecutionStore from './domains/ExecutionStore';
import SettingStore from './domains/Setting.store'

export function createStores(config, eventBus) {
    const { getLogger, queueServerUri, host, port, baseUriPath } = config;
    const eventStore = new EventStore(getLogger);
    const settingStore = new SettingStore(getLogger)
    const executionDb = new ExecutionDb(getLogger)
    const callbackUri = `http://${host}:${port}/${baseUriPath}`

    const executionStore = new ExecutionStore(executionDb, eventStore, eventBus, queueServerUri, callbackUri, getLogger)

    return {
        eventStore,
        settingStore,
        executionStore,
    };
}
