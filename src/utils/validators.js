const Joi = require("joi");

const registerSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    full_name: Joi.string().min(2).required(),
    role: Joi.string().valid("patient", "doctor", "admin").default("patient"),
  }),
});

const loginSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    mfa_token: Joi.string().optional(),
  }),
});

const availabilityCreateSchema = Joi.object({
  body: Joi.object({
    start_time: Joi.date().required(),
    end_time: Joi.date().greater(Joi.ref("start_time")).required(),
  }),
});

const bookSchema = Joi.object({
  body: Joi.object({
    slot_id: Joi.number().integer().required(),
  }),
});

const prescriptionSchema = Joi.object({
  body: Joi.object({
    consultation_id: Joi.number().integer().required(),
    content: Joi.string().min(3).required(),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  availabilityCreateSchema,
  bookSchema,
  prescriptionSchema,
};
