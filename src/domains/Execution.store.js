import execa from 'execa'
import { ObjectId } from 'mongodb'
import EventStore from './Event.store';
import Execution from './Execution';
import { Progress } from './Execution.compositions';
import ExecutionDb from './Execution.db';
import {
    EXECUTION_ABORTED,
    EXECUTION_CONFIRMED,
    EXECUTION_PAUSED,
    EXECUTION_RESUMED,
    EXECUTION_STARTED,
    STAGE_FAILED,
    STAGE_STARTED,
    STAGE_SUCCEEDED
} from './Execution.events';


export default class ExecutionStore {
    constructor(executionDb: ExecutionDb,
                eventStore: EventStore,
                eventBus: EventEmitter,
                getLogger) {
        this.logger = getLogger('Execution.store.js')
        this.executionDb = executionDb
        this.eventStore = eventStore
        this.eventBus = eventBus

        this.eventStore.on(EXECUTION_STARTED, async event => await this.#start(event))
        this.eventStore.on(STAGE_STARTED, async event => this.#stageStarted(event.data, event.creator))
        this.eventStore.on(STAGE_SUCCEEDED, async event => this.#stageSucceeded(event.data))
        this.eventStore.on(STAGE_FAILED, async event => this.#stageFailed(event.data))

        this.eventStore.on(EXECUTION_CONFIRMED, async event => await this.#confirm(event.execution))
        this.eventStore.on(EXECUTION_ABORTED, async event => await this.#abort(event.execution))
        this.eventStore.on(EXECUTION_PAUSED, async event => await this.#pause(event.execution))
        this.eventStore.on(EXECUTION_RESUMED, async event => await this.#resume(event.execution))
    }

    executionDb: ExecutionDb
    eventStore: EventStore
    eventBus: EventEmitter
    logger


    /**
     * 开始执行
     * @param _id {ObjectId}
     * @param creator {String}
     * @param stages {[]}
     * */
    async #start({ _id, creator, data: stages }) {
        const execution = new Execution({ _id, stages, creator })
        await this.executionDb.insert(execution)
        await this.#next(execution._id)
    }

    /**
     * 进行下一个循环
     * @param executionId {ObjectId}
     * */
    async #next(executionId: ObjectId) {
        const execution: Execution = await this.executionDb.get(executionId)
        if (execution.canStartNext()) {
            const stages = execution.startNextStages()
            await this.executionDb.update(execution)
            await this.#executeStages(stages, executionId, execution.creator)
        } else {
            execution.stopIfNoRunningStages()
            await this.executionDb.update(execution)
        }
    }

    /**
     * 触发阶段执行
     * @param stages {Progress[]}
     * @param execution {ObjectId}
     * @param creator {String}
     * */
    async #executeStages(stages: Progress[], execution: ObjectId, creator: String) {
        for (const stage: Progress of stages) {
            const { name, input, options, type } = stage
            await this.eventStore.store({
                type: STAGE_STARTED,
                creator,
                data: { execution, name, input, options, type }
            })
        }
    }

    /**
     * 启动阶段执行并触发相应结果事件
     * @param execution {ObjectId}
     * @param name {String} 阶段名称
     * @param input {Object}
     * @param options {Object}
     * @param type {String}
     * @param creator {String}
     * */
    async #stageStarted({
                            execution,
                            name,
                            input,
                            options,
                            type
                        }, creator) {
        let err = await this.#executeCommand(type, options, input)
        await this.eventStore.store({
            type: err ? STAGE_FAILED : STAGE_SUCCEEDED,
            creator,
            data: { execution, stage: name, err }
        })
    }

    /**
     * 实际执行
     * @param type {String}
     * @param options {Object}
     * @param input {Object}
     * */
    async #executeCommand(type, options, input) {
        try {
            this.logger.info(`准备执行命令：${options.shell}`)
            const { stdout } = await execa(type, ['-c', options.shell], { env: input })
            this.logger.info(`命令输出：${stdout}`)
        } catch ({ command, exitCode, signal, signalDescription, stderr, failed, timedOut, isCanceled, killed }) {
            this.logger.info(stderr)
            return { command, exitCode, signal, signalDescription, stderr, failed, timedOut, isCanceled, killed }
        }
    }

    /**
     * 当阶段成功时，更新执行状态并进入后续处理（比如等待所有正在执行的阶段完成后更新执行状态）
     * @param execution {ObjectId}
     * @param stage {String}
     * */
    async #stageSucceeded({ execution, stage }) {
        await this.executionDb.update((await this.executionDb.get(execution)).stageSucceed(stage))
        await this.#next(execution)
    }

    /**
     * 当阶段执行失败时，更新执行状态并进入后续处理（比如等待所有正在执行的阶段完成后更新执行状态）
     * @param execution {ObjectId}
     * @param stage {String}
     * @param err {Object}
     * */
    async #stageFailed({ execution, stage, err }) {
        await this.executionDb.update((await this.executionDb.get(execution)).stageFail(stage, err))
        await this.#next(execution)
    }

    async #confirm(execution) {
        if (execution?.status === Execution.status.PENDING) {
            const stages = execution.startPendingStages()
            await this.executionDb.update(execution)
            await this.#executeStages(stages, execution._id, execution.creator)
        }
    }

    get(executionId) {
        const _id = ObjectId(executionId)
        return this.executionDb.get(_id);
    }

    async #abort(execution) {
        const status = {
            [Execution.status.RUNNING]: true,
            [Execution.status.PAUSING]: true,
            [Execution.status.PAUSED]: true,
            [Execution.status.PENDING]: true,
        }
        if (status[execution?.status]) {
            execution.status = Execution.status.ABORTING
            await this.executionDb.update(execution)
        }
    }

    async #pause(execution) {
        if (execution.status === Execution.status.RUNNING) {
            execution.status = Execution.status.PAUSING
            await this.executionDb.update(execution)
        }
    }

    async #resume(execution: Execution) {
        if (execution.status === Execution.status.PAUSED) {
            execution.status = Execution.status.RUNNING
            await this.executionDb.update(execution)
            await this.#next(execution._id)
        }
    }
}
