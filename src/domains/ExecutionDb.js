import mongo from '../utils/mongo';
import Execution from './Execution';

const TABLE = 'executions'
export default class ExecutionDb {
    constructor(getLogger) {
        this.logger = getLogger('ExecutionDb.js')
    }

    async insert(execution: Execution) {
        const { _id, stages, status, variables, } = execution
        await mongo(async db => await db.collection(TABLE).insertOne({ _id, stages, status, variables, }))
    }

    async get(_id): Execution {
        const execution = await mongo(async db => await db.collection(TABLE).findOne({ _id }))
        if (execution)
            return new Execution(execution)
        else {
            return null
        }
    }

    async update(execution: Execution) {
        const { _id} = execution
        await mongo(async db => await db.collection(TABLE).replaceOne({ _id }, execution))
    }


}
