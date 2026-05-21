import mysql from 'mysql2/promise'

async function testExistingDB() {
  const dbNames = ['cloud', 'erp', 'mysql']

  for (const dbName of dbNames) {
    for (const pwd of ['', 'root', 'password']) {
      try {
        const connection = await mysql.createConnection({
          host: 'localhost',
          port: 3306,
          user: 'root',
          password: pwd,
          database: dbName
        })
        console.log(`✅ 连接成功! 数据库: ${dbName}, 密码: "${pwd}"`)
        await connection.end()
        return { dbName, password: pwd }
      } catch (error) {
        console.log(`❌ ${dbName}/${pwd}: ${error.message.split('\n')[0]}`)
      }
    }
  }
  console.log('❌ 所有数据库连接都失败了')
  return null
}

await testExistingDB()