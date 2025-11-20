# Logos Corporativos

Esta carpeta contiene los logos oficiales de RUN Solutions y Grupo Nearlink 360.

## Archivos Requeridos

Coloca los siguientes archivos en esta carpeta:

- `run.png` - Logo de RUN Solutions (recomendado: 500x200px, PNG transparente)
- `nearlink.png` - Logo de Grupo Nearlink 360 (recomendado: 500x200px, PNG transparente)
- `logos_run_nearlink.png` - Logo combinado usado en el formulario web

## Especificaciones

### Para la Web (FormOrden)
- **Formato**: PNG con transparencia
- **Dimensiones recomendadas**: 600x180px
- **Peso máximo**: 200KB
- **Uso**: Se muestra en el encabezado del formulario

### Para el PDF
- **Formato**: PNG con transparencia
- **Dimensiones recomendadas**: 500x150px
- **Peso máximo**: 150KB
- **Uso**: Se embebe en el PDF generado (esquina superior derecha)

## Paleta de Colores Corporativos

### RUN Solutions
- **Azul principal**: `#0052CC`
- **Azul secundario**: `#0747A6`
- **Rojo**: `#C80000`

### Nearlink 360
- Usar colores oficiales de la marca

## Nota Importante

Los logos son propiedad de RUN Solutions y Grupo Nearlink 360.
No usar sin autorización expresa.

## Placeholder

Si no tienes los logos aún, el sistema mostrará un placeholder de texto
hasta que los archivos sean agregados a esta carpeta.

Para agregar los logos:

1. Coloca los archivos PNG en esta carpeta
2. Asegúrate de que tengan los nombres correctos
3. Reinicia la aplicación si es necesario

```bash
# Ejemplo de estructura esperada:
public/
  logos/
    run.png
    nearlink.png
    logos_run_nearlink.png
```

## Testing

Para verificar que los logos se carguen correctamente:

1. **Web**: Abre http://localhost:3000/orden
2. **PDF**: Genera un PDF y verifica que el logo aparezca

Si los logos no aparecen:
- Verifica los nombres de archivo
- Verifica permisos de lectura
- Verifica el tamaño (no deben ser muy grandes)
- Revisa la consola del navegador para errores
