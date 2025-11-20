'use client';

interface SummaryCardProps {
  monto: number;
  tipoMonto?: 'integrado' | 'mas_iva';
}

export function SummaryCard({ monto, tipoMonto = 'integrado' }: SummaryCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Si es integrado: el monto ya incluye IVA
  // Si es más IVA: el monto es el subtotal y se calcula IVA
  let subtotal: number;
  let iva: number;
  let total: number;

  if (tipoMonto === 'integrado') {
    // Monto integrado: el monto es el total, desglosamos IVA
    total = monto;
    subtotal = monto / 1.16; // Desglosamos el IVA del total
    iva = total - subtotal;
  } else {
    // Monto más IVA: el monto es el subtotal
    subtotal = monto;
    iva = monto * 0.16;
    total = subtotal + iva;
  }

  return (
    <div className="bg-gradient-to-br from-run-gray-50 to-white rounded-xl p-6 border border-run-gray-200 shadow-card">
      <h3 className="text-sm font-bold text-run-gray-700 uppercase tracking-wide mb-4">
        Resumen de Montos
      </h3>

      <div className="space-y-3">
        {tipoMonto === 'mas_iva' && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-sm text-run-gray-600">Subtotal:</span>
              <span className="text-base font-medium text-run-gray-900">
                {formatCurrency(subtotal)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-run-gray-600">IVA (16%):</span>
              <span className="text-base font-medium text-run-gray-900">
                {formatCurrency(iva)}
              </span>
            </div>
          </>
        )}

        {tipoMonto === 'integrado' && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-sm text-run-gray-600">Subtotal:</span>
              <span className="text-base font-medium text-run-gray-900">
                {formatCurrency(subtotal)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-run-gray-600">IVA (16% incluido):</span>
              <span className="text-base font-medium text-run-gray-900">
                {formatCurrency(iva)}
              </span>
            </div>
          </>
        )}

        <div className="pt-3 border-t-2 border-run-gray-300">
          <div className="flex justify-between items-center">
            <span className="text-base font-bold text-run-gray-900">
              Total:
            </span>
            <span className="text-2xl font-bold text-brand-primary">
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-run-gray-500 italic">
        {tipoMonto === 'integrado'
          ? '* El monto mostrado ya incluye IVA al 16%.'
          : '* Se calculará IVA del 16% sobre el monto ingresado.'}
      </p>
    </div>
  );
}
