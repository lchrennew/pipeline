/* eslint-disable no-param-reassign */


import { diff } from 'deep-diff';
import {
    EXECUTION_ABORTED,
    EXECUTION_CONFIRMED,
    EXECUTION_PAUSED,
    EXECUTION_RESUMED,
    EXECUTION_STARTED,
    STAGE_FAILED,
    STAGE_STARTED,
    STAGE_SUCCEEDED
} from '../domains/Execution.events';

const executionTypes = [
    EXECUTION_RESUMED,
    EXECUTION_PAUSED,
    EXECUTION_CONFIRMED,
    EXECUTION_STARTED,
    EXECUTION_ABORTED,
]

const stageTypes = [
    STAGE_FAILED,
    STAGE_SUCCEEDED,
    STAGE_STARTED,
]

function baseTypeFor(event) {
    if (executionTypes.includes(event.type)) {
        return 'executions';
    }
    if (stageTypes.includes(event.type)) {
        return 'stages'
    }
    throw new Error(`unknown event type: ${JSON.stringify(event)}`);
}

function groupByBaseTypeAndName(events) {
    const groups = {};

    events.forEach((event) => {
        const baseType = baseTypeFor(event);

        groups[baseType] = groups[baseType] || {};
        groups[baseType][event.data.name] =
            groups[baseType][event.data.name] || [];

        groups[baseType][event.data.name].push(event);
    });

    return groups;
}

function eachConsecutiveEvent(events, callback) {
    const groups = groupByBaseTypeAndName(events);

    Object.keys(groups).forEach((baseType) => {
        const group = groups[baseType];

        Object.keys(group).forEach((name) => {
            const currentEvents = group[name];
            let left;
            let right;
            let i;
            let l;
            for (i = 0, l = currentEvents.length; i < l; i++) {
                left = currentEvents[i];
                right = currentEvents[i + 1];

                callback(left, right);
            }
        });
    });
}

function addDiffs(events) {
    eachConsecutiveEvent(events, (left, right) => {
        if (right) {
            left.diffs = diff(right.data, left.data) || [];
        } else {
            left.diffs = null;
        }
    });
}

export default {
    addDiffs,
};
