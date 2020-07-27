import EventStore from '../../domains/Event.store';
import {
    EXECUTION_ABORTED,
    EXECUTION_CONFIRMED,
    EXECUTION_PAUSED,
    EXECUTION_RESUMED,
    EXECUTION_STARTED
} from '../../domains/Execution.events';
import extractUsername from '../../extractUsername';
import Controller from '../Controller';

export default class PipelineController extends Controller {

    constructor(config) {
        super(config);

        this.eventStore = config.stores.eventStore
        this.executionStore = config.stores.executionStore

        this.post('/exec', this.execute)
        this.post('/exec/:id/confirm', [this.requireExecution, this.confirm])
        this.post('/exec/:id/abort', [this.requireExecution, this.abort])
        this.post('/exec/:id/pause', [this.requireExecution, this.pause])
        // this.post('/exec/:id/pause')
        // this.post('/exec/:id/resume/:stage')
    }

    eventStore: EventStore
    executionStore

    /**开始执行*/
    async execute(ctx) {
        const username = extractUsername(ctx)
        const { stages } = ctx.request.body
        await this.eventStore.store({
            type: EXECUTION_STARTED,
            creator: username,
            data: stages,
        })
        ctx.status = 201
    }

    /**进行中放弃*/
    async abort(ctx) {
        const username = extractUsername(ctx)
        const { id } = ctx.params
        await this.eventStore.store({ type: EXECUTION_ABORTED, creator: username, data: id })
        ctx.status = 201
    }

    /**进行中暂停*/
    async pause(ctx) {
        const username = extractUsername(ctx)
        const { id } = ctx.params
        await this.eventStore.store({ type: EXECUTION_PAUSED, creator: username, data: id })
    }

    /**暂停后继续*/
    async resume(ctx) {
        const username = extractUsername(ctx)
        const { id } = ctx.params
        await this.eventStore.store({ type: EXECUTION_RESUMED, creator: username, data: id })
    }

    /**挂起后确认继续*/
    async confirm(ctx) {
        const username = extractUsername(ctx)
        const { id } = ctx.params
        await this.eventStore.store({
            type: EXECUTION_CONFIRMED,
            creator: username,
            data: id,
            execution: ctx.execution
        })
        ctx.status = 200
    }

    async requireExecution(ctx, next) {
        const { id } = ctx.params
        const execution = await this.executionStore.get(id)
        if (!execution) {
            ctx.status = 404
        } else {
            ctx.execution = execution
            await next()
        }
    }
}
