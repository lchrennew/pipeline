import { ObjectId } from 'mongodb'
import EventStore from '../../domains/EventStore';
import { EXECUTION_TICKED, STAGE_FAILED, STAGE_PREPARED, STAGE_SUCCEEDED } from '../../domains/Execution.events';
import ExecutionStore from '../../domains/ExecutionStore';
import Controller from '../Controller';

export default class PipelineController extends Controller {

    constructor(config) {
        super(config);

        this.eventStore = config.stores.eventStore
        this.executionStore = config.stores.executionStore

        this.post('/exec/:id/:stage/ready', [this.requireExecution, this.ready])
        this.post('/exec/:id/:stage/succeeded', [this.requireExecution, this.succeeded])
        this.post('/exec/:id/:stage/failed', [this.requireExecution, this.failed])
        this.post('/exec/:id/next', [this.requireExecution, this.next])
    }

    eventStore: EventStore
    executionStore: ExecutionStore

    async requireExecution(ctx, next) {
        const { id } = ctx.params
        const execution = await this.executionStore.get(ObjectId(id))
        if (!execution) {
            ctx.status = 404
        } else {
            ctx.execution = execution
            await next()
        }
    }

    async ready(ctx) {
        const { id, stage } = ctx.params

        await this.eventStore.store({
            type: STAGE_PREPARED,
            creator: 'client',
            data: { execution: ObjectId(id), name: stage },
            execution: ctx.execution
        })
        ctx.status = 200
    }

    async succeeded(ctx) {
        const { id, stage } = ctx.params

        await this.eventStore.store({
            type: STAGE_SUCCEEDED,
            creator: 'client',
            data: { execution: ObjectId(id), stage },
            execution: ctx.execution
        })
        ctx.status = 200
    }

    async failed(ctx) {
        const { id, stage } = ctx.params
        const { err } = ctx.request.body

        await this.eventStore.store({
            type: STAGE_FAILED,
            creator: 'client',
            data: { execution: ObjectId(id), stage, err },
            execution: ctx.execution
        })
        ctx.status = 200
    }


    async next(ctx) {
        await this.eventStore.store({
            type: EXECUTION_TICKED,
            creator: 'execution',
            data: ObjectId(id),
        })
        ctx.status = 201
    }
}
