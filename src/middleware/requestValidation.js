function validate(schema) {
  return function (req, res, next) {
    const toValidate = { body: req.body, query: req.query, params: req.params };
    const { error, value } = schema.validate(toValidate, {
      allowUnknown: true,
    });
    if (error) return res.status(400).json({ error: error.details[0].message });
    req.validated = value;
    next();
  };
}

module.exports = { validate };
