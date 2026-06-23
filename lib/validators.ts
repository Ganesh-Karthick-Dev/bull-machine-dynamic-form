import { z } from 'zod';
import { FormField } from './schema-parser';

/**
 * Dynamically builds a Zod schema based on the array of fields in the form configuration.
 */
export function buildFormSchema(fields: FormField[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    let fieldSchema: z.ZodTypeAny;

    switch (field.type) {
      case 'text':
      case 'textarea':
      case 'select':
      case 'radio':
        fieldSchema = z.coerce.string();
        if (field.required) {
          fieldSchema = (fieldSchema as z.ZodString).min(1, { message: `${field.label} is required` });
        } else {
          // Allow empty strings for optional fields instead of forcing null/undefined
          fieldSchema = (fieldSchema as z.ZodString).optional().or(z.literal(''));
        }
        break;

      case 'email':
        fieldSchema = z.coerce.string();
        if (field.required) {
          fieldSchema = (fieldSchema as z.ZodString)
            .min(1, { message: `${field.label} is required` })
            .email({ message: "Invalid email address" });
        } else {
          fieldSchema = (fieldSchema as z.ZodString)
            .email({ message: "Invalid email address" })
            .optional()
            .or(z.literal(''));
        }
        break;

      case 'number':
        if (field.required) {
          fieldSchema = z.preprocess(
            (val) => {
              if (val === '' || val === undefined || val === null) return undefined;
              const num = Number(val);
              return isNaN(num) ? val : num;
            },
            z.number({ message: `${field.label} must be a number` })
          );
          // Check for empty field before type check
          fieldSchema = z.any()
            .refine((val) => val !== undefined && val !== null && val !== '', {
              message: `${field.label} is required`
            })
            .pipe(fieldSchema);
        } else {
          fieldSchema = z.preprocess(
            (val) => {
              if (val === '' || val === undefined || val === null) return undefined;
              const num = Number(val);
              return isNaN(num) ? val : num;
            },
            z.number({ message: `${field.label} must be a number` }).optional()
          );
        }
        break;

      case 'date':
        // HTML date picker returns "YYYY-MM-DD"
        fieldSchema = z.coerce.string();
        if (field.required) {
          fieldSchema = (fieldSchema as z.ZodString)
            .min(1, { message: `${field.label} is required` })
            .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" });
        } else {
          fieldSchema = (fieldSchema as z.ZodString)
            .refine((val) => val === '' || !isNaN(Date.parse(val)), { message: "Invalid date format" })
            .optional()
            .or(z.literal(''));
        }
        break;

      case 'checkbox':
        fieldSchema = z.boolean();
        if (field.required) {
          fieldSchema = (fieldSchema as z.ZodBoolean).refine((val) => val === true, {
            message: `${field.label} must be checked`,
          });
        } else {
          fieldSchema = (fieldSchema as z.ZodBoolean).optional().default(false);
        }
        break;

      default:
        fieldSchema = z.any();
    }

    shape[field.id] = fieldSchema;
  }

  return z.object(shape);
}

/**
 * Resolves the default value for each field.
 */
export function getDefaultValues(fields: FormField[]) {
  const defaults: Record<string, any> = {};
  for (const field of fields) {
    if (field.defaultValue !== undefined) {
      if (field.type === 'checkbox') {
        defaults[field.id] = field.defaultValue === 'true' || field.defaultValue === true;
      } else if (field.type === 'number') {
        defaults[field.id] = field.defaultValue !== '' ? Number(field.defaultValue) : '';
      } else {
        defaults[field.id] = field.defaultValue;
      }
    } else {
      switch (field.type) {
        case 'checkbox':
          defaults[field.id] = false;
          break;
        case 'number':
          defaults[field.id] = '';
          break;
        default:
          defaults[field.id] = '';
      }
    }
  }
  return defaults;
}
