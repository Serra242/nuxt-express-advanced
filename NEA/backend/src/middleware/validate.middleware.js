function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    })

    if (!result.success) {
      console.error(
        'Error de validación',
        result.error.flatten(),
      )

      return res.status(400).json({
        message:
          'Bad request. There is an issue with the provided data.',
      })
    }

    req.validated = result.data
    return next()
  }
}

module.exports = validate