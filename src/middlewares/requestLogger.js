export default config => {
    const logger = config.getLogger('HTTP');
    return async (ctx, next) => {
        await next();
        logger.info(`${ctx.status} ${ctx.method} ${ctx.path}`);
    };
}
