import { z } from 'zod';

/**
 * Schema de validación para el formulario de Orden de Autorización y Compra
 * Implementa validaciones robustas con mensajes de error en español
 */
export const ordenSchema = z.object({
  folio: z
    .string()
    .min(1, 'El folio es requerido')
    .max(50, 'El folio no puede exceder 50 caracteres')
    .regex(/^[A-Z0-9-]+$/i, 'El folio solo puede contener letras, números y guiones'),

  descripcion: z
    .string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(1000, 'La descripción no puede exceder 1000 caracteres'),

  monto: z
    .number({
      required_error: 'El monto es requerido',
      invalid_type_error: 'El monto debe ser un número válido',
    })
    .positive('El monto debe ser mayor a 0')
    .max(999999999, 'El monto excede el límite permitido')
    .transform(val => Number(val.toFixed(2))),

  tipoMonto: z
    .enum(['integrado', 'mas_iva'], {
      errorMap: () => ({ message: 'Debes seleccionar un tipo de monto' }),
    })
    .default('integrado'),

  fechaCreacion: z
    .string()
    .min(1, 'La fecha de creación es requerida')
    .refine(
      (date) => {
        const d = new Date(date);
        return !isNaN(d.getTime());
      },
      { message: 'Fecha inválida' }
    ),

  fechaMinPago: z
    .string()
    .optional()
    .refine(
      (date) => {
        if (!date) return true;
        const d = new Date(date);
        return !isNaN(d.getTime());
      },
      { message: 'Fecha inválida' }
    ),

  fechaMaxPago: z
    .string()
    .optional()
    .refine(
      (date) => {
        if (!date) return true;
        const d = new Date(date);
        return !isNaN(d.getTime());
      },
      { message: 'Fecha inválida' }
    ),

  autoriza: z.enum(
    [
      'Dirección General',
      'Dirección Operativa',
      'Dirección Administrativa',
      'Dirección Tecnología',
    ],
    {
      errorMap: () => ({ message: 'Debes seleccionar quien autoriza' }),
    }
  ),

  comentarios: z
    .string()
    .max(2000, 'Los comentarios no pueden exceder 2000 caracteres')
    .optional()
    .default(''),
}).refine(
  (data) => {
    // Validación cruzada: fechaMinPago debe ser menor o igual a fechaMaxPago
    if (data.fechaMinPago && data.fechaMaxPago) {
      const min = new Date(data.fechaMinPago);
      const max = new Date(data.fechaMaxPago);
      return min <= max;
    }
    return true;
  },
  {
    message: 'La fecha mínima de pago debe ser anterior o igual a la fecha máxima',
    path: ['fechaMaxPago'],
  }
);

// Tipos TypeScript generados automáticamente desde el schema
export type OrdenFormData = z.infer<typeof ordenSchema>;

// Valores iniciales del formulario
export const initialValues: OrdenFormData = {
  folio: '',
  descripcion: '',
  monto: 0,
  fechaCreacion: new Date().toISOString().split('T')[0],
  fechaMinPago: '',
  fechaMaxPago: '',
  autoriza: 'Dirección General',
  comentarios: '',
  tipoMonto: 'integrado',
};

// Opciones para el dropdown de quien autoriza
export const autorizaOptions = [
  { value: 'Dirección General', label: 'Dirección General' },
  { value: 'Dirección Operativa', label: 'Dirección Operativa' },
  { value: 'Dirección Administrativa', label: 'Dirección Administrativa' },
  { value: 'Dirección Tecnología', label: 'Dirección Tecnología' },
] as const;

/**
 * Función helper para validar el formulario con Zod
 */
export const validateOrdenForm = (values: OrdenFormData) => {
  try {
    ordenSchema.parse(values);
    return {};
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path) {
          errors[err.path[0]] = err.message;
        }
      });
      return errors;
    }
    return {};
  }
};
