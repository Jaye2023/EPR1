import mysql from 'mysql2/promise'

async function tryAllConnections() {
  const configOptions = [
    { user: 'root', password: '' },
    { user: 'root', password: 'root' },
    { user: 'root', password: 'password' },
    { user: 'Administrator', password: '' },
    { user: 'Administrator', password: 'root' },
    { user: 'admin', password: '' },
    { user: 'admin', password: 'root' },
    { user: '', password: '' },
  ]

  for (const config of configOptions) {
    try {
      const connection = await mysql.createConnection({
        host: 'localhost',
        port: 3306,
        ...config
      })
      console.log(`✅ SUCCESS with:`, config)
      await connection.end()
      return config
    } catch (error) {
      console.log(`❌ Failed:`, config, `-`, error.message.split('\n')[0])
    }
  }

  console.log('\n=== Trying with named pipe ===')
  try {
    const connection = await mysql.createConnection({
      socketPath: 'C:/ProgramData/MySQL/MySQL Server 8.0/Data/mysql.sock',
      user: 'root',
      password: ''
    })
    console.log(`✅ SUCCESS with socket!`)
    await connection.end()
    return { socket: true }
  } catch (error) {
    console.log(`❌ Socket failed:`, error.message.split('\n')[0])
  }

  return null
}

const result = await tryAllConnections()
console.log('\nResult:', result)