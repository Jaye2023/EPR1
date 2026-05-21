const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
}

const currentLevel = LOG_LEVELS.DEBUG

export function log(message, level = 'INFO', ...args) {
  const levelNum = LOG_LEVELS[level.toUpperCase()]
  if (levelNum < currentLevel) return

  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`

  switch (level.toUpperCase()) {
    case 'DEBUG':
      console.debug(prefix, message, ...args)
      break
    case 'INFO':
      console.info(prefix, message, ...args)
      break
    case 'WARN':
      console.warn(prefix, message, ...args)
      break
    case 'ERROR':
      console.error(prefix, message, ...args)
      break
    default:
      console.log(prefix, message, ...args)
  }
}

export function debug(message, ...args) {
  log(message, 'DEBUG', ...args)
}

export function info(message, ...args) {
  log(message, 'INFO', ...args)
}

export function warn(message, ...args) {
  log(message, 'WARN', ...args)
}

export function error(message, ...args) {
  log(message, 'ERROR', ...args)
}

export function logApiCall(method, url, params = {}, responseTime = 0) {
  info(`API Call: ${method} ${url}`, {
    params,
    responseTime: `${responseTime}ms`
  })
}

export function logApiError(method, url, error) {
  error(`API Error: ${method} ${url}`, error)
}

export default {
  log,
  debug,
  info,
  warn,
  error,
  logApiCall,
  logApiError
}