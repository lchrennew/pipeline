import { Dirent } from 'fs'
import fs from 'fs/promises'
import path from 'path'
import { asArray } from '../utils/constants';
import mongo from '../utils/mongo';

const TABLE = 'migrations'

const up = async () => {
    const migrations = await loadMigrations()
    const scripts = await loadScripts(migrations)

    for (const { name, script: { up } } of scripts) {
        await up()
        await mongo(async db => await db.collection(TABLE).insertOne({ name }))
    }
}
const loadMigrations = async () => {
    return (await mongo(async db => await db.collection(TABLE).find({}, { sort: { name: 1 } }), { asArray }))
}

const loadScripts = async (migrations) => {
    const scriptPath = path.join(process.cwd(), 'src', 'migrations', 'scripts')
    const names = (await fs.readdir(scriptPath, { withFileTypes: true }))
        .filter((dirent: Dirent) => dirent.isFile() &&
            /\d{14}-.+\.js$/.test(dirent.name) &&
            migrations.every(migration => migration.name !== dirent.name))
        .map(({ name }) => name)
    return names
        .sort()
        .map(name => ({
            name,
            script: require(path.join(scriptPath, name)),
        }))
}


export default { up }
