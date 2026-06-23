import { z } from 'zod';

export const FormFieldTypeSchema = z.enum([
  'text',
  'email',
  'number',
  'date',
  'textarea',
  'select',
  'checkbox',
  'radio',
  'hidden'
]);

export type FormFieldType = z.infer<typeof FormFieldTypeSchema>;

export const FormFieldSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]+$/, {
    message: "Field ID must be alphanumeric and can contain underscores or dashes",
  }),
  label: z.string().min(1, "Label is required"),
  type: FormFieldTypeSchema,
  required: z.boolean().default(false),
  defaultValue: z.any().optional(),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
});

export type FormField = z.infer<typeof FormFieldSchema>;

export const FormConfigSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  webhookUrl: z.string().url("Valid webhook URL is required").optional().or(z.literal('')),
  submitButtonText: z.string().default("Submit"),
  successMessage: z.string().default("Thank you. Your response has been submitted."),
  fields: z.array(FormFieldSchema).min(1, "Form must have at least one field"),
}).refine((data) => {
  // Validate that select/radio fields have options
  for (const field of data.fields) {
    if ((field.type === 'select' || field.type === 'radio') && (!field.options || field.options.length === 0)) {
      return false;
    }
  }
  return true;
}, {
  message: "Select and Radio fields must have options",
  path: ["fields"],
});

export type FormConfig = z.infer<typeof FormConfigSchema>;

/**
 * Safely decodes a Base64 encoded JSON string from a URL parameter.
 * Handles standard Base64, URL-safe Base64, and URI encoding.
 */
export function safeDecodeBase64(base64Str: string): string | null {
  try {
    // 1. Decode URI encoding (e.g. converting %2B back to +, etc.)
    let sanitized = decodeURIComponent(base64Str).trim();
    
    // 2. Convert URL-safe base64 characters to standard base64 characters
    sanitized = sanitized.replace(/-/g, '+').replace(/_/g, '/');
    
    // 3. Re-add padding '=' if it was stripped
    const padLength = (4 - (sanitized.length % 4)) % 4;
    if (padLength > 0) {
      sanitized += '='.repeat(padLength);
    }
    
    // 4. Decode using Node.js Buffer (which is standard and handles UTF-8 correctly)
    return Buffer.from(sanitized, 'base64').toString('utf-8');
  } catch (error) {
    console.error("Base64 decoding failed:", error);
    return null;
  }
}

/**
 * Parses and validates the form configuration schema.
 */
export function parseFormConfig(jsonStr: string): { success: true; data: FormConfig } | { success: false; error: string } {
  try {
    const rawData = JSON.parse(jsonStr);
    const result = FormConfigSchema.safeParse(rawData);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      const errorMsg = result.error.issues
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      return { success: false, error: errorMsg };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Invalid JSON string" };
  }
}
