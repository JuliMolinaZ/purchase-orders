import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generateOrdenPdf } from '@/lib/pdf/generateOrdenPdf';
import { ordenSchema } from '@/lib/validators/ordenSchema';
import { z } from 'zod';

/**
 * POST /api/pdf
 * Genera un PDF de Orden de Autorización y Compra
 * 🔒 Requiere autenticación
 *
 * @body OrdenFormData - Datos del formulario validados
 * @returns PDF file as blob or error response
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión.' },
        { status: 401 }
      );
    }

    // Parse body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        {
          error: 'Error al procesar los datos',
          message: 'El cuerpo de la petición no es válido',
          type: 'ParseError',
        },
        { status: 400 }
      );
    }

    // Validar datos con Zod
    let validatedData;
    try {
      validatedData = ordenSchema.parse(body);
    } catch (zodError) {
      if (zodError instanceof z.ZodError) {
        console.error('Error de validación Zod:', zodError.errors);
        return NextResponse.json(
          {
            error: 'Datos inválidos',
            message: 'Los datos del formulario no son válidos',
            details: zodError.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
            type: 'ZodError',
          },
          { status: 400 }
        );
      }
      throw zodError;
    }

    // Generar PDF
    let pdfBytes;
    try {
      pdfBytes = await generateOrdenPdf(validatedData);
    } catch (pdfError) {
      console.error('Error generando PDF:', pdfError);
      const errorMessage = pdfError instanceof Error 
        ? pdfError.message 
        : String(pdfError);
      
      return NextResponse.json(
        {
          error: 'Error al generar el PDF',
          message: errorMessage,
          type: pdfError instanceof Error ? pdfError.constructor.name : 'Unknown',
        },
        { status: 500 }
      );
    }

    // Convertir Uint8Array a Buffer para NextResponse
    const buffer = Buffer.from(pdfBytes);

    // Crear nombre de archivo
    const fileName = `Orden_Autorizacion_Compra_${validatedData.folio.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;

    // Retornar PDF como respuesta
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: unknown) {
    // Log detallado del error para debugging
    console.error('=== ERROR AL GENERAR PDF (catch final) ===');
    console.error('Error completo:', error);
    
    // Error de validación de Zod
    if (error instanceof z.ZodError) {
      console.error('Es un error de validación Zod');
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          message: 'Los datos del formulario no son válidos',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
          type: 'ZodError',
        },
        { status: 400 }
      );
    }

    // Extraer mensaje de error de forma segura
    let errorMessage = 'Error desconocido al generar el PDF';
    let errorType = 'Unknown';
    
    try {
      if (error instanceof Error) {
        errorMessage = error.message || error.name || 'Error desconocido';
        errorType = error.constructor.name || 'Error';
        console.error('Error message:', error.message);
        console.error('Error name:', error.name);
        console.error('Error stack:', error.stack);
      } else if (typeof error === 'string') {
        errorMessage = error;
        errorType = 'String';
      } else if (error !== null && typeof error === 'object') {
        try {
          const errorObj = error as Record<string, unknown>;
          errorMessage = errorObj.message as string || errorObj.toString?.() || JSON.stringify(error);
        } catch {
          errorMessage = String(error);
        }
      } else {
        errorMessage = String(error);
      }
    } catch (errorProcessingError) {
      console.error('Error procesando el error:', errorProcessingError);
      errorMessage = 'Error desconocido al generar el PDF';
      errorType = 'Unknown';
    }
    
    // Garantizar que siempre tengamos valores válidos
    const errorResponse = {
      error: 'Error al generar el PDF',
      message: errorMessage || 'Error desconocido',
      type: errorType || 'Unknown',
    };
    
    console.error('Enviando respuesta de error:', errorResponse);
    
    // Retornar siempre un JSON válido
    try {
      return NextResponse.json(errorResponse, { status: 500 });
    } catch (jsonError) {
      // Si incluso esto falla, retornar un error básico
      console.error('Error al crear respuesta JSON:', jsonError);
      return new NextResponse(
        JSON.stringify({ error: 'Error al generar el PDF', message: 'Error crítico del servidor' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
}

/**
 * GET /api/pdf
 * Retorna información sobre el endpoint
 * 🔒 Requiere autenticación
 */
export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    endpoint: '/api/pdf',
    method: 'POST',
    description: 'Genera un PDF de Orden de Autorización y Compra',
    version: '1.0.0',
    authenticated: true,
    user: {
      name: session.user?.name || session.user?.email || 'Usuario',
      email: session.user?.email || 'N/A',
      role: session.user?.role || 'user',
    },
    fields: {
      folio: 'string (required)',
      descripcion: 'string (required)',
      monto: 'number (required)',
      fechaCreacion: 'string ISO date (required)',
      fechaMinPago: 'string ISO date (optional)',
      fechaMaxPago: 'string ISO date (optional)',
      autoriza: 'string (required)',
      comentarios: 'string (optional)',
    },
  });
}
