/**
 * Utilidades para formateo de fechas
 * Centraliza la configuración de date-fns
 */

import { format as formatFns } from 'date-fns';
import { es } from 'date-fns/locale/es';

/**
 * Formatea una fecha al estilo español (formato compacto para PDF)
 * Ejemplo: "15 de nov. de 2025" (más corto que "15 de noviembre de 2025")
 */
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return '__/__/____';

  try {
    const date = new Date(dateString + 'T00:00:00');

    if (isNaN(date.getTime())) {
      return '__/__/____';
    }

    // Usar formato más compacto con abreviatura del mes para ahorrar espacio
    return formatFns(date, "d 'de' MMM 'de' yyyy", { locale: es });
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return '__/__/____';
  }
}

/**
 * Formatea una fecha al estilo corto
 * Ejemplo: "15/03/2025"
 */
export function formatDateShort(dateString: string | undefined): string {
  if (!dateString) return '__/__/____';

  try {
    const date = new Date(dateString + 'T00:00:00');

    if (isNaN(date.getTime())) {
      return '__/__/____';
    }

    return formatFns(date, 'dd/MM/yyyy', { locale: es });
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return '__/__/____';
  }
}

/**
 * Formatea un número como moneda mexicana
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Valida si una cadena es una fecha válida
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}
