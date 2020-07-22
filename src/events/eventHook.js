import { EXECUTION_STARTED } from '../domains/Execution.events';


export function addEventHook(eventHook, eventStore) {
    eventStore.on(EXECUTION_STARTED, data=>eventHook?.(EXECUTION_STARTED, data))
}
