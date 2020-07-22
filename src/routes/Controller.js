import Router from '@koa/router'

import checkPermission from '../middlewares/permissionChecker';

/**
 * Base class for Controllers to standardize binding to express Router.
 */
class Controller {
    constructor(config) {
        this.router = new Router().prefix(config.baseUriPath)
        this.config = config;
    }

    router: Router;

    get(path, handlers, permission) {
        const handler = handlers?.map?.(handler => handler?.bind(this)) ?? [handlers?.bind(this)]
        handler && this.router.get(
            path,
            checkPermission(this.config, permission),
            ...handler
        );
    }

    post(path, handlers, permission) {
        const handler = handlers?.map?.(handler => handler?.bind(this)) ?? [handlers?.bind(this)]
        handler && this.router.post(
            path,
            checkPermission(this.config, permission),
            ...handler
        );
    }

    put(path, handlers, permission) {
        const handler = handlers?.map?.(handler => handler?.bind(this)) ?? [handlers?.bind(this)]
        handler && this.router.put(
            path,
            checkPermission(this.config, permission),
            ...handler,
        );
    }

    delete(path, handlers, permission) {
        const handler = handlers?.map?.(handler => handler?.bind(this)) ?? [handlers?.bind(this)]
        handler && this.router.delete(
            path,
            checkPermission(this.config, permission),
            ...handler,
        );
    }

    fileupload(path, filehandler, handler, permission) {
        this.router.post(
            path,
            checkPermission(this.config, permission),
            filehandler,
            handler.bind(this),
        );
    }

    use(path, controller: Controller) {
        this.router.use(path, controller.routes())
    }

    routes() {
        return this.router.routes()
    }
}

export default Controller;
