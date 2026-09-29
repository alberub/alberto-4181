# Estado de entrega

## Revisión de los puntos 3 al 9

| Punto                         | Estado                                         | Evidencia / pendiente                                                                                                                                                                 |
| ----------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3. Diseño y herramientas      | Completado en la entrega local                 | Diseño adaptado de la referencia visual; librerías, partes generadas y contribución del responsable descritas en `RESPUESTA.md` y README.                                             |
| 4. Uso de IA                  | Documentado                                    | Codex, usos, proceso de validación y límites de autoría declarados. No se presenta código asistido como escritura manual.                                                             |
| 5. Buenas prácticas y pruebas | Validación completada; Git pendiente de cierre | Separación por capas, contratos, validación, persistencia y errores; 30 pruebas de lógica/API y 10 E2E aprobadas. Rama main inicializada; falta identidad del autor y commit inicial. |
| 6. Funcionalidad mínima       | Verificada                                     | Registro, acceso posterior, logout y nuevo login con la misma cuenta aprobados en escritorio y móvil.                                                                                 |
| 7. Entregables                | Preparados, con pendientes explícitos          | PDF, instrucciones de ejecución/pruebas y reproducción de SnailPay disponibles. Tiempo estimado confirmado: 5 horas. Faltan commit y URL pública de GitHub.                           |
| 8. Propuesta de base de datos | Completada como propuesta                      | PostgreSQL: entidades, relaciones, cambios en frontend/backend, transacciones e idempotencia. No se implementó SQL.                                                                   |
| 8. Despliegue público         | Pospuesto                                      | Se atenderá posteriormente; no se declara una URL de aplicación desplegada.                                                                                                           |
| 9. Criterios de evaluación    | Evidencias organizadas                         | `VALIDACION.md`, `SNAILPAY.md` y `GUIA_CODIGO.md`. La capacidad de explicar/modificar el código depende de la revisión personal del responsable.                                      |

## Archivos para revisión

- `output/pdf/respuesta-snail-club.pdf`: documento principal y propuesta SQL, con los pendientes visibles.
- `README.md`: instalación, ejecución local y compilada, pruebas y límites.
- `docs/SNAILPAY.md`: contrato y escenarios reproducibles por interfaz o terminal.
- `docs/VALIDACION.md`: resultados y alcance real de la comprobación.
- `docs/POSTGRESQL.md`: propuesta ampliada de persistencia.
- `docs/GUIA_CODIGO.md`: recorrido del código y decisiones que deben poder explicarse.

## Validación realizada

Instalación desde una copia limpia mediante npm ci, compilación de esa copia y prueba del servidor compilado. El caché local no contenía todas las dependencias, por lo que la instalación limpia descargó las versiones fijadas desde npm. Se ejecutaron las 30 pruebas de lógica/API y 10 recorridos E2E en el proyecto. Los cinco comandos de demostración devolvieron 200, 422, 503, 504 y 400 según su escenario.

El PDF se comprueba en Arial de 10 puntos, sin imágenes ni bloques de código, con tres páginas principales y una página de propuesta PostgreSQL. El documento sigue marcado como borrador por los datos faltantes de entrega, no por un fallo de funcionamiento local.

## Cierre pendiente

1. Confirmar nombre y correo que deben figurar en Git; realizar el commit inicial.
2. Publicar el código en GitHub y verificar que sea accesible públicamente. Nombre preparado: `alberto-4181`, generado con cuatro cifras aleatorias; disponibilidad no comprobada.
3. Incorporar la URL real al documento, quitar el aviso de borrador y regenerar/verificar el PDF.

El despliegue de la aplicación es independiente de publicar el repositorio y queda fuera de este cierre.
