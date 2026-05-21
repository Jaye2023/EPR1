import { getDb } from './config.js'

const db = getDb()
const rows = db.prepare('SELECT * FROM roles').all()
console.log('Roles:', JSON.stringify(rows, null, 2))