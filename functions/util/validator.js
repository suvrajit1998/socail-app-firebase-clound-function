const validator = require('validator')

const isEmail = (email) => {
  if (validator.isEmail(email)) return true
  else return false
}

const isEmpty = (string) => {
  if (validator.isEmpty(string)) return true
  else return false
}

exports.validateSignUpData = (data) => {
  let errors = {}

  if (isEmpty(data.email)) {
    errors.email = 'Email must be not empty'
  } else if (!isEmail(data.email)) {
    errors.email = 'must be a valid email address'
  }

  if (isEmpty(data.password)) errors.password = 'must not be empty'
  if (data.password !== data.confirmPassword)
    errors.confirmPassword = 'password must match'
  if (isEmpty(data.handle)) errors.handle = 'must be not empty'

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  }
}

exports.validateLoginData = (data) => {
  let errors = {}

  if (isEmpty(data.email)) errors.email = 'must not be empty'
  if (isEmpty(data.password)) errors.password = 'must not be empty'

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  }
}

exports.reduceUserDetails = (data) => {
  let userDetails = {}

  if (!isEmpty(data.bio.trim())) userDetails.bio = data.bio

  if (!isEmpty(data.website.trim())) {
    if (data.website.trim().substring(0, 4) !== 'http') {
      userDetails.website = `http://${data.website.trim()}`
    } else userDetails.website = data.website
  }

  if (!isEmpty(data.location.trim())) userDetails.location = data.location

  return userDetails
}
