# Estado de entrega

## Revisión de los puntos 3 al 9

| Punto                         | Estado                                        | Evidencia / pendiente                                                                                                                                                                                             |
| ----------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3. Diseño y herramientas      | Completado en la entrega local                | Diseño adaptado de la referencia visual; librerías, partes generadas y contribución del responsable descritas en `RESPUESTA.md` y README.                                                                         |
| 4. Uso de IA                  | Documentado                                   | Codex, usos, proceso de validación y límites de autoría declarados. No se presenta código asistido como escritura manual.                                                                                         |
| 5. Buenas prácticas y pruebas | Validación local completada; Git inicializado | Separación por capas, contratos, validación, persistencia y errores; 30 pruebas de lógica/API y 10 E2E aprobadas. Commit inicial existente en main y repositorio público verificado.                              |
| 6. Funcionalidad mínima       | Verificada                                    | Registro, acceso posterior, logout y nuevo login con la misma cuenta aprobados en escritorio y móvil.                                                                                                             |
| 7. Entregables                | Preparados, con pendientes explícitos         | PDF, instrucciones de ejecución/pruebas y reproducción de SnailPay disponibles. Tiempo estimado confirmado: 5 horas. GitHub público verificado; falta publicar los últimos cambios de despliegue y documentación. |
| 8. Propuesta de base de datos | Completada como propuesta                     | PostgreSQL: entidades, relaciones, cambios en frontend/backend, transacciones e idempotencia. No se implementó SQL.                                                                                               |
| 8. Despliegue público         | HTTPS y API verificados                       | https://alberto-4181.duckdns.org; Contabo, Docker y Caddy. Recorrido público de navegador pendiente.                                                                                                              |
| 9. Criterios de evaluación    | Evidencias organizadas                        | `VALIDACION.md`, `SNAILPAY.md` y `GUIA_CODIGO.md`. La capacidad de explicar/modificar el código depende de la revisión personal del responsable.                                                                  |

## Archivos para revisión

- `output/pdf/respuesta-snail-club.pdf`: documento principal y propuesta SQL, con los pendientes visibles.
- `README.md`: instalación, ejecución local y compilada, pruebas y límites.
- `docs/SNAILPAY.md`: contrato y escenarios reproducibles por interfaz o terminal.
- `docs/VALIDACION.md`: resultados y alcance real de la comprobación.
- `docs/POSTGRESQL.md`: propuesta ampliada de persistencia.
- `docs/GUIA_CODIGO.md`: recorrido del código y decisiones que deben poder explicarse.

## Validación realizada

Instalación desde una copia limpia mediante npm ci, compilación de esa copia y prueba del servidor compilado. El caché local no contenía todas las dependencias, por lo que la instalación limpia descargó las versiones fijadas desde npm. Se ejecutaron las 30 pruebas de lógica/API y 10 recorridos E2E en el proyecto. Los cinco comandos de demostración devolvieron 200, 422, 503, 504 y 400 según su escenario.

El PDF se comprueba en Arial de 10 puntos, sin imágenes ni bloques de código, con tres páginas principales, una de despliegue y una de propuesta PostgreSQL. Los límites de validación están expresados en el documento.

## Cierre pendiente

1. Comprobar registro, inicio/cierre de sesión y recarga en la URL pública.
2. Publicar los últimos archivos de despliegue y documentación en GitHub.
3. Revisar personalmente el código y entregar el PDF actualizado.

El adicional 1 exige URL pública, plataforma, explicación breve y limitaciones;
se documenta en RESPUESTA.md y en su PDF. El adicional 2 exige únicamente una
propuesta de base de datos, no su implementación.
