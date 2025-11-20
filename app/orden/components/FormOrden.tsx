'use client';

import { Formik, Form, Field, ErrorMessage } from 'formik';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  OrdenFormData,
  initialValues,
  validateOrdenForm,
  autorizaOptions,
} from '@/lib/validators/ordenSchema';
import { FormField } from './FormField';
import { SummaryCard } from './SummaryCard';
import clsx from 'clsx';

interface FormOrdenProps {
  onSuccess?: () => void;
}

export function FormOrden({ onSuccess }: FormOrdenProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<OrdenFormData | null>(null);

  const handleSubmit = async (values: OrdenFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        let errorMessage = 'Error al generar el PDF';
        try {
          const errorData = await response.json();
          console.error('Error response data:', errorData);
          errorMessage = errorData.error || errorData.message || errorMessage;
          if (errorData.details) {
            console.error('Error details:', errorData.details);
            errorMessage += ` - ${JSON.stringify(errorData.details)}`;
          }
          if (errorData.type) {
            console.error('Error type:', errorData.type);
          }
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError);
          try {
            const text = await response.text();
            console.error('Error response (text):', text);
            errorMessage = text || errorMessage;
          } catch (textError) {
            console.error('Error reading response text:', textError);
            errorMessage = `Error ${response.status}: ${response.statusText}`;
          }
        }
        console.error('Final error message:', errorMessage);
        throw new Error(errorMessage);
      }

      // Descargar el PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Orden_${values.folio}_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onSuccess?.();
    } catch (error) {
      console.error('Error:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al generar el PDF'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = (values: OrdenFormData) => {
    setPreviewData(values);
    setShowPreview(true);
  };

  return (
    <>
      <Formik
        initialValues={initialValues}
        validate={validateOrdenForm}
        onSubmit={handleSubmit}
        validateOnChange={true}
        validateOnBlur={true}
      >
        {({ values, errors, touched, isValid }) => (
          <Form className="space-y-6">
            {/* Folio */}
            <FormField
              name="folio"
              label="Folio de documento"
              placeholder="Ej. OC-2025-001"
              required
              autoComplete="off"
            />

            {/* Descripción */}
            <div>
              <label
                htmlFor="descripcion"
                className="block text-sm font-semibold text-run-gray-900 mb-2"
              >
                Descripción / Concepto
                <span className="text-brand-accent ml-1">*</span>
              </label>
              <Field
                as="textarea"
                id="descripcion"
                name="descripcion"
                rows={4}
                placeholder="Ej. Compra de racks selectivos para almacén principal"
                className={clsx(
                  'w-full px-4 py-3 rounded-lg border transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent',
                  'resize-y min-h-[100px] max-h-[300px]',
                  'font-sans text-sm',
                  errors.descripcion && touched.descripcion
                    ? 'border-red-500 bg-red-50'
                    : 'border-run-gray-300 hover:border-run-gray-400'
                )}
              />
              <ErrorMessage
                name="descripcion"
                component="p"
                className="mt-1 text-sm text-red-600"
              />
            </div>

            {/* Monto y Fecha Creación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="monto"
                  className="block text-sm font-semibold text-run-gray-900 mb-2"
                >
                  Monto (MXN)
                  <span className="text-brand-accent ml-1">*</span>
                </label>
                <Field
                  type="number"
                  id="monto"
                  name="monto"
                  step="0.01"
                  min="0"
                  placeholder="150000.00"
                  className={clsx(
                    'w-full px-4 py-3 rounded-lg border transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent',
                    'font-sans text-sm',
                    errors.monto && touched.monto
                      ? 'border-red-500 bg-red-50'
                      : 'border-run-gray-300 hover:border-run-gray-400'
                  )}
                />
                <ErrorMessage
                  name="monto"
                  component="p"
                  className="mt-1 text-sm text-red-600"
                />
              </div>

              <FormField
                name="fechaCreacion"
                label="Fecha de creación de orden de compra"
                type="date"
                required
              />
            </div>

            {/* Tipo de Monto */}
            <div>
              <label className="block text-sm font-semibold text-run-gray-900 mb-3">
                Tipo de monto
                <span className="text-brand-accent ml-1">*</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <label
                  className={clsx(
                    'flex-1 px-6 py-4 rounded-lg border-2 cursor-pointer transition-all duration-200',
                    'flex items-center justify-center gap-2',
                    values.tipoMonto === 'integrado'
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                      : 'border-run-gray-300 hover:border-run-gray-400 text-run-gray-700'
                  )}
                >
                  <Field
                    type="radio"
                    name="tipoMonto"
                    value="integrado"
                    className="w-4 h-4 text-brand-primary focus:ring-brand-primary focus:ring-2"
                  />
                  <div className="text-center">
                    <div className="font-semibold">Monto Integrado</div>
                    <div className="text-xs opacity-75 mt-1">
                      El monto ya incluye IVA
                    </div>
                  </div>
                </label>

                <label
                  className={clsx(
                    'flex-1 px-6 py-4 rounded-lg border-2 cursor-pointer transition-all duration-200',
                    'flex items-center justify-center gap-2',
                    values.tipoMonto === 'mas_iva'
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                      : 'border-run-gray-300 hover:border-run-gray-400 text-run-gray-700'
                  )}
                >
                  <Field
                    type="radio"
                    name="tipoMonto"
                    value="mas_iva"
                    className="w-4 h-4 text-brand-primary focus:ring-brand-primary focus:ring-2"
                  />
                  <div className="text-center">
                    <div className="font-semibold">Monto + IVA</div>
                    <div className="text-xs opacity-75 mt-1">
                      Se calculará IVA del 16%
                    </div>
                  </div>
                </label>
              </div>
              <ErrorMessage
                name="tipoMonto"
                component="p"
                className="mt-1 text-sm text-red-600"
              />
            </div>

            {/* Fechas de Pago */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="fechaMinPago"
                label="Fecha mínima de pago"
                type="date"
              />
              <FormField
                name="fechaMaxPago"
                label="Fecha máxima de pago"
                type="date"
              />
            </div>

            <p className="text-xs text-run-gray-600 -mt-2">
              Las fechas proporcionadas son aproximadas y siempre se recomienda
              considerar la fecha máxima de pago.
            </p>

            {/* Quien Autoriza */}
            <div>
              <label
                htmlFor="autoriza"
                className="block text-sm font-semibold text-run-gray-900 mb-2"
              >
                Quién autoriza
                <span className="text-brand-accent ml-1">*</span>
              </label>
              <Field
                as="select"
                id="autoriza"
                name="autoriza"
                className={clsx(
                  'w-full px-4 py-3 rounded-lg border transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'bg-white text-run-gray-900',
                  errors.autoriza && touched.autoriza
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-run-gray-300 hover:border-run-gray-400'
                )}
              >
                {autorizaOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Field>
              <ErrorMessage
                name="autoriza"
                component="p"
                className="mt-1 text-sm text-red-600"
              />
            </div>

            {/* Comentarios */}
            <div>
              <label
                htmlFor="comentarios"
                className="block text-sm font-semibold text-run-gray-900 mb-2"
              >
                Comentarios / Notas adicionales
              </label>
              <Field
                as="textarea"
                id="comentarios"
                name="comentarios"
                rows={3}
                placeholder="Condiciones de pago, proveedor sugerido, plazos, etc."
                className={clsx(
                  'w-full px-4 py-3 rounded-lg border transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent',
                  'resize-y min-h-[80px] max-h-[200px]',
                  'font-sans text-sm',
                  'border-run-gray-300 hover:border-run-gray-400'
                )}
              />
            </div>

            {/* Resumen visual cuando hay datos */}
            {values.monto > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <SummaryCard monto={values.monto} tipoMonto={values.tipoMonto} />
              </motion.div>
            )}

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={() => handlePreview(values)}
                disabled={!isValid || isSubmitting}
                className={clsx(
                  'flex-1 px-6 py-3 rounded-full font-semibold text-sm',
                  'transition-all duration-200',
                  'border-2 border-brand-primary text-brand-primary',
                  'hover:bg-brand-primary hover:text-white',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-brand-primary'
                )}
              >
                Vista Previa
              </button>

              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className={clsx(
                  'flex-1 px-6 py-3 rounded-full font-semibold text-sm',
                  'bg-brand-primary text-white',
                  'hover:bg-brand-secondary hover:shadow-button-hover',
                  'active:transform active:scale-95',
                  'transition-all duration-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'shadow-button'
                )}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Generando PDF...
                  </span>
                ) : (
                  'Generar PDF'
                )}
              </button>
            </div>

            <p className="text-xs text-center text-run-gray-600">
              El PDF incluirá formato tipo orden de compra, folio, fechas de
              pago, logos y firma &quot;AUTORIZA DIRECCIÓN GENERAL&quot;.
            </p>
          </Form>
        )}
      </Formik>

      {/* Modal de preview */}
      {showPreview && previewData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-run-gray-900 mb-6">
              Vista Previa de la Orden
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-run-gray-700">
                  Folio
                </p>
                <p className="text-lg">{previewData.folio}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-run-gray-700">
                  Descripción
                </p>
                <p className="text-base">{previewData.descripcion}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-run-gray-700">
                    Monto
                  </p>
                  <p className="text-lg text-brand-primary font-bold">
                    {new Intl.NumberFormat('es-MX', {
                      style: 'currency',
                      currency: 'MXN',
                    }).format(previewData.monto)}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-run-gray-700">
                    Autoriza
                  </p>
                  <p className="text-base">{previewData.autoriza}</p>
                </div>
              </div>

              <SummaryCard monto={previewData.monto} tipoMonto={previewData.tipoMonto} />
            </div>

            <button
              onClick={() => setShowPreview(false)}
              className="mt-6 w-full px-6 py-3 rounded-full font-semibold text-sm bg-run-gray-200 hover:bg-run-gray-300 transition-colors"
            >
              Cerrar
            </button>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
