import client from 'prom-client';
import events from './events/events';
export function startMonitoring(
    enable,
    eventBus,
) {
    if (!enable) {
        return;
    }

    client.collectDefaultMetrics();

    const requestDuration = new client.Summary({
        name: 'http_request_duration_milliseconds',
        help: 'App response time',
        labelNames: ['path', 'method', 'status'],
        percentiles: [0.1, 0.5, 0.9, 0.99],
    });
    const dbDuration = new client.Summary({
        name: 'db_query_duration_seconds',
        help: 'DB query duration time',
        labelNames: ['store', 'action'],
        percentiles: [0.1, 0.5, 0.9, 0.99],
    });

    eventBus.on(events.REQUEST_TIME, ({ path, method, time, statusCode }) => {
        requestDuration.labels(path, method, statusCode).observe(time);
    });

    eventBus.on(events.DB_TIME, ({ store, action, time }) => {
        dbDuration.labels(store, action).observe(time);
    });

}
