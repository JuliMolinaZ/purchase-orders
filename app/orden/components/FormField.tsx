'use client';

import { Field, ErrorMessage } from 'formik';
import clsx from 'clsx';

interface FormFieldProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
}

export function FormField({
  name,
  label,
  type = 'text',
  placeholder,
  required = false,
  autoComplete,
}: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-semibold text-run-gray-900 mb-2"
      >
        {label}
        {required && <span className="text-brand-accent ml-1">*</span>}
      </label>
      <Field name={name}>
        {({ field, meta }: any) => (
          <input
            {...field}
            id={name}
            type={type}
            placeholder={placeholder}
            autoComplete={autoComplete}
            className={clsx(
              'w-full px-4 py-3 rounded-lg border transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent',
              'font-sans text-sm',
              meta.touched && meta.error
                ? 'border-red-500 bg-red-50'
                : 'border-run-gray-300 hover:border-run-gray-400'
            )}
          />
        )}
      </Field>
      <ErrorMessage
        name={name}
        component="p"
        className="mt-1 text-sm text-red-600"
      />
    </div>
  );
}
