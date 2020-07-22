import { REQUEST_TIME } from '../events/events';


export default config =>
    async (ctx, next) => {
        const start = process.hrtime();
        await next()
        let time = process.hrtime(start);
        // Format to high resolution time with nano time
        time = time[0] * 1000 + time[1] / 1000000;
        if (!config?.hrtime) {
            // truncate to milliseconds.
            time = Math.round(time);
        }
        ctx.set('X-Response-Time', `${time}ms`);
        const timingInfo = {
            path: ctx.path,
            method: ctx.method,
            statusCode: ctx.status,
            time,
        };
        config?.eventBus?.emit(REQUEST_TIME, timingInfo);
    }
