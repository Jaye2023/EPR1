export function normalizeError(error) {
  if (!error) {
    return {
      message: '未知错误',
      name: 'UnknownError',
      stack: null,
      status: null,
      response: null
    }
  }

  if (typeof error === 'string') {
    return {
      message: error,
      name: 'StringError',
      stack: null,
      status: null,
      response: null
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message || '未知错误',
      name: error.name || 'Error',
      stack: error.stack || null,
      status: null,
      response: null
    }
  }

  if (typeof error === 'object') {
    return {
      message: error.message || error.msg || '未知错误',
      name: error.name || 'ObjectError',
      stack: error.stack || null,
      status: error.status || error.response?.status || null,
      response: error.response || null
    }
  }

  return {
    message: String(error),
    name: 'UnknownError',
    stack: null,
    status: null,
    response: null
  }
}

export function getErrorMessage(error) {
  const normalized = normalizeError(error)
  
  if (normalized.status) {
    switch (normalized.status) {
      case 400:
        return '请求参数错误'
      case 401:
        return '未授权访问，请重新登录'
      case 403:
        return '无权访问该资源'
      case 404:
        return '请求的资源不存在'
      case 500:
        return '服务器内部错误'
      default:
        return normalized.message
    }
  }

  return normalized.message
}

export function handleApiError(error, customMessage = '操作失败') {
  const normalized = normalizeError(error)
  
  console.error(`${customMessage}:`, normalized)
  
  return {
    success: false,
    error: getErrorMessage(normalized),
    status: normalized.status
  }
}

export function isNetworkError(error) {
  const normalized = normalizeError(error)
  return ['Network Error', 'ERR_NETWORK', 'ECONNREFUSED'].some(keyword => 
    normalized.message?.includes(keyword)
  )
}

export function isAuthError(error) {
  const normalized = normalizeError(error)
  return normalized.status === 401 || normalized.message?.includes('Unauthorized')
}