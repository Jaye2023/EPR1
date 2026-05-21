export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone) {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

export function validateCreditCode(code) {
  const creditCodeRegex = /^[0-9A-Z]{18}$/
  return creditCodeRegex.test(code)
}

export function validateBankAccount(account) {
  const bankRegex = /^\d{16,19}$/
  return bankRegex.test(account)
}

export function validateUrl(url) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function validateDate(dateStr) {
  const date = new Date(dateStr)
  return !isNaN(date.getTime())
}

export function validateNumber(value) {
  return !isNaN(parseFloat(value)) && isFinite(value)
}

export function validateRequired(value) {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value).length > 0
  return true
}

export function validateLength(value, min, max) {
  if (!value) return false
  const len = String(value).length
  return len >= min && len <= max
}

export function validateMin(value, min) {
  const num = parseFloat(value)
  return !isNaN(num) && num >= min
}

export function validateMax(value, max) {
  const num = parseFloat(value)
  return !isNaN(num) && num <= max
}

export function validateMinMax(value, min, max) {
  return validateMin(value, min) && validateMax(value, max)
}

export function validateIdCard(idCard) {
  const idCardRegex = /(^\d{18}$)|(^\d{17}(\d|X|x)$)/
  if (!idCardRegex.test(idCard)) return false
  
  const weight = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const checkCode = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
  let sum = 0
  
  for (let i = 0; i < 17; i++) {
    sum += parseInt(idCard[i]) * weight[i]
  }
  
  const remainder = sum % 11
  return checkCode[remainder] === idCard[17].toUpperCase()
}

export function validateSupplierCode(code) {
  const codeRegex = /^SUP\d{3,6}$/
  return codeRegex.test(code)
}

export function validateMaterialCode(code) {
  const codeRegex = /^P-PL-AG\d{3,6}$/
  return codeRegex.test(code)
}

export function validateForm(formData, rules) {
  const errors = {}
  
  for (const field in rules) {
    const fieldRules = rules[field]
    const value = formData[field]
    
    for (const rule of fieldRules) {
      if (rule.required && !validateRequired(value)) {
        errors[field] = rule.message || `${field}不能为空`
        break
      }
      
      if (rule.email && !validateEmail(value)) {
        errors[field] = rule.message || `${field}格式不正确`
        break
      }
      
      if (rule.phone && !validatePhone(value)) {
        errors[field] = rule.message || `${field}格式不正确`
        break
      }
      
      if (rule.creditCode && !validateCreditCode(value)) {
        errors[field] = rule.message || `${field}格式不正确`
        break
      }
      
      if (rule.bankAccount && !validateBankAccount(value)) {
        errors[field] = rule.message || `${field}格式不正确`
        break
      }
      
      if (rule.url && !validateUrl(value)) {
        errors[field] = rule.message || `${field}格式不正确`
        break
      }
      
      if (rule.date && !validateDate(value)) {
        errors[field] = rule.message || `${field}格式不正确`
        break
      }
      
      if (rule.number && !validateNumber(value)) {
        errors[field] = rule.message || `${field}必须是数字`
        break
      }
      
      if (rule.min !== undefined && !validateMin(value, rule.min)) {
        errors[field] = rule.message || `${field}不能小于${rule.min}`
        break
      }
      
      if (rule.max !== undefined && !validateMax(value, rule.max)) {
        errors[field] = rule.message || `${field}不能大于${rule.max}`
        break
      }
      
      if (rule.minLength !== undefined && !validateLength(value, rule.minLength, Infinity)) {
        errors[field] = rule.message || `${field}长度不能小于${rule.minLength}`
        break
      }
      
      if (rule.maxLength !== undefined && !validateLength(value, 0, rule.maxLength)) {
        errors[field] = rule.message || `${field}长度不能大于${rule.maxLength}`
        break
      }
      
      if (rule.pattern && !rule.pattern.test(value)) {
        errors[field] = rule.message || `${field}格式不正确`
        break
      }
      
      if (typeof rule.validator === 'function') {
        const result = rule.validator(value, formData)
        if (result !== true) {
          errors[field] = result || rule.message || `${field}验证失败`
          break
        }
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export default {
  validateEmail,
  validatePhone,
  validateCreditCode,
  validateBankAccount,
  validateUrl,
  validateDate,
  validateNumber,
  validateRequired,
  validateLength,
  validateMin,
  validateMax,
  validateMinMax,
  validateIdCard,
  validateSupplierCode,
  validateMaterialCode,
  validateForm
}