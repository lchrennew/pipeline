import cors from '@koa/cors'
import Koa from 'koa'
import koaBody from 'koa-body';
import compress from 'koa-compress'
import error from 'koa-error';
import requestLogger from './middlewares/requestLogger';
import responseTime from './middlewares/responseTime';
import IndexController from './routes/index'

export default function (config): Koa {
    const app = new Koa()
    config.preHook?.(app)

    app.use(requestLogger(config))
    app.use(cors({ credentials: true }))
    app.use(compress())
    app.use(responseTime(config))
    app.use(koaBody())
    config.preRouterHook?.(app)

    app.use(new IndexController(config).routes())
    if (process.env.NODE_ENV !== 'production') {
        app.use(error());
    }
    return app

}
