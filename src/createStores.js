import EventStore from './domains/Event.store';
import ExecutionDb from './domains/Execution.db';
import ExecutionStore from './domains/Execution.store';
import SettingStore from './domains/Setting.store'

export function createStores(config, eventBus) {
    const { getLogger } = config;
    const eventStore = new EventStore(getLogger);
    const settingStore = new SettingStore(getLogger)
    const executionDb = new ExecutionDb(getLogger)

    return {
        eventStore,
        settingStore,
        executionStore: new ExecutionStore(executionDb, eventStore, eventBus, getLogger)
    };
}
