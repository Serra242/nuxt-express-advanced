function loginDto(validated) {
  return Object.freeze({
    email: validated.body.email,
    password: validated.body.password,
  })
}

function createUserDto(validated) {
  return Object.freeze({
    email: validated.body.email,
    password: validated.body.password,
    role: validated.body.role,
  })
}

module.exports = {
  loginDto,
  createUserDto,
}