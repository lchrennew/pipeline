import { ObjectId } from 'mongodb'
import sift from 'sift'
import { Progress } from './Execution.compositions';
export default class Execution {

    static status = {
        INITIALIZED: 'initialized',
        RUNNING: 'running',
        SUCCEEDED: 'succeeded',
        FINALIZED: 'finalized',
        PAUSING: 'pausing',
        PAUSED: 'paused',
        FAILING: 'failing',
        FAILED: 'failed',
        ABORTING: 'aborting',
        ABORTED: 'aborted',
        PENDING: 'pending'
    }
    static events = {
        INITIALIZED: 'initialized',
        STARTED: 'started',
    }

    static nextStatusTransformations = {
        [Execution.status.INITIALIZED]: () => Execution.status.RUNNING,
        [Execution.status.PAUSING]: (execution: Execution) => execution.#hasRunningStages() || Execution.status.PAUSED,
        [Execution.status.ABORTING]: (execution: Execution) => execution.#hasRunningStages() || Execution.status.ABORTED,
        [Execution.status.FAILING]: (execution: Execution) => execution.#hasRunningStages() || Execution.status.FAILED,
        [Execution.status.RUNNING]: (execution: Execution) => (execution.#allStagesSucceeded() && Execution.status.SUCCEEDED) || (execution.#onlyPendingStagesLeft() && Execution.status.PENDING),
    }

    constructor({ _id, status = Execution.status.INITIALIZED, stages = [], variables = {}, creator }) {
        this._id = _id
        this.creator = creator
        this.status = status
        this.variables = variables ?? {}
        this.stages = stages.map(stage => new Progress(stage))
    }

    _id: ObjectId
    status = Execution.status.INITIALIZED
    stages: Progress[] = []
    variables = {}

    canStartNext(): Boolean {
        const statuses = {
            [Execution.status.INITIALIZED]: true,
            [Execution.status.RUNNING]: true,
        }
        return statuses[this.status]
    }

    #hasRunningStages(): Boolean {
        const statuses = {
            [Progress.status.RUNNING]: true,
        }
        return this.stages.some(progress => statuses[progress.status])
    }

    #allStagesSucceeded(): Boolean {
        const statuses = { [Progress.status.SUCCEEDED]: true }
        return this.stages.every(progress => statuses[progress.status])
    }

    #onlyPendingStagesLeft(): Boolean {
        const statuses = {
            [Progress.status.RUNNING]: false,
            [Progress.status.FAILED]: false,
            [Progress.status.SUCCEEDED]: true,
            [Progress.status.QUEUEING]: true,
            [Progress.status.PENDING]: true,
            [Progress.status.SUCCEEDED]: true,
        }
        return this.stages.every(progress => statuses[progress.status])
    }

    #findNextStages(): Progress[] {
        const statuses = { [Progress.status.QUEUEING]: true }
        return this.stages.filter(
            ({ status, preconditions, }) =>
                statuses[status] &&
                preconditions?.every(query => sift(query)(this.variables)))
    }

    #setNextStatus() {
        const nextStatus = Execution.nextStatusTransformations[this.status](this)
        if (nextStatus)
            this.status = nextStatus
        return this
    }

    /**状态更新，返回新启动的阶段*/
    startNextStages(): Progress[] {
        return this
            .#setNextStatus()
            .#findNextStages()
            .filter(stage => stage.start(this.variables))
    }

    /**状态更新，返回新启动的阶段*/
    startPendingStages(): Progress[] {
        this.status = Execution.status.RUNNING
        return this.stages.filter(stage => stage.confirm(this.variables))
    }

    stopIfNoRunningStages() {
        this.#setNextStatus()
    }

    #getStage(name): Progress {
        return this.stages.find(stage => stage.name === name)
    }

    stageSucceed(name, output = {}) {
        const change = { ...output, [`stage_${name}`]: Progress.status.SUCCEEDED }
        this.#getStage(name).succeed(output)
        this.variables = { ...this.variables, ...change }
        return this
    }

    stageFail(name, err, output) {
        const change = { ...output, [`stage_${name}`]: Progress.status.FAILED, [`stage_${name}_err`]: err }
        this.#getStage(name).fail({ ...output, err })
        this.variables = { ...this.variables, ...change }
        this.status = Execution.status.FAILING
        return this
    }
}
