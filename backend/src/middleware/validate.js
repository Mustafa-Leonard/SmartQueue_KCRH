import { errorResponse } from '../utils/apiResponse.js';

const validate = (schema) => (req, res, next) => {
  try {
    // Validate request body
    const validatedData = schema.parse(req.body);
    req.body = validatedData; // Replace with cast schema types
    next();
  } catch (error) {
    const errorMessages = error.errors.map(
      (err) => `${err.path.join('.')}: ${err.message}`
    );
    return errorResponse(res, 'Request validation failed', errorMessages, 400);
  }
};

export default validate;
