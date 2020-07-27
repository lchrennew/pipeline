import Stage from './specifications/Stage';

export class Progress extends Stage {
    static status = {
        QUEUEING: 'queueing',
        PENDING: 'pending',
        PREPARING: 'preparing',
        RUNNING: 'running',
        SUCCEEDED: 'succeeded',
        FAILED: 'failed',
    }

    constructor({ name, preconditions, type, options, startedAt, stoppedAt, input, output, status = Progress.status.QUEUEING, manual }) {
        super();
        this.name = name
        this.preconditions = preconditions
        this.type = type
        this.options = options
        this.status = status
        this.startedAt = startedAt
        this.stoppedAt = stoppedAt
        this.input = input
        this.output = output
        this.manual = manual
    }

    status = Progress.status.QUEUEING
    startedAt: Date
    input: Object
    stoppedAt: Date
    output: Object

    start() {
        this.status = Progress.status.PENDING
        return !this.manual && this.confirm()
    }

    confirm() {
        if (this.status === Progress.status.PENDING) {
            this.status = Progress.status.PREPARING
            this.startedAt = new Date()
            return true
        }
    }

    run(input) {
        if (this.status === Progress.status.PREPARING) {
            this.status = Progress.status.RUNNING
            this.input = input
            return true
        }
    }

    succeed(output = {}) {
        this.status = Progress.status.SUCCEEDED
        this.output = output
        this.stoppedAt = new Date()
    }

    fail(output = {}) {
        this.status = Progress.status.FAILED
        this.output = output
        this.stoppedAt = new Date()
    }
}
