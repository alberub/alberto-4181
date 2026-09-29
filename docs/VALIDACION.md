# Validación local

Fecha: 28 de septiembre de 2026. Entorno: macOS, Node.js 24.15.0. Resultados de la implementación local, sin despliegue público.

| Comprobación                        | Resultado                          | Qué demuestra                                                                                 |
| ----------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------- |
| `npm run build`                     | Aprobada                           | TypeScript, empaquetado del frontend y compilación del backend                                |
| `npm test`                          | 30 pruebas aprobadas en 4 archivos | Lógica de cuenta, persistencia, montos, contrato de API, idempotencia y errores de transporte |
| `npm run test:e2e`                  | 10 pruebas aprobadas               | 5 recorridos en escritorio y los mismos 5 en viewport móvil Chromium                          |
| `node scripts/smoke-production.mjs` | Aprobada                           | API compilada, entrega del frontend y rutas SPA; API inexistente responde 404                 |
| Revisión visual                     | Realizada                          | Registro, dashboard y recarga en escritorio y móvil                                           |
| Errores de navegador                | Ninguno en la revisión visual      | No hubo excepciones de página durante registro y navegación                                   |
| Ancho móvil                         | Sin desbordamiento horizontal      | Validado en viewport de 390 px                                                                |
| PDF                                 | 4 páginas, Arial 10, sin imágenes  | Revisión de todas las páginas renderizadas                                                    |

## Recorridos completos

1. Registro, dashboard protegido, saldo cero, recargas aprobadas desde el modal y desde la página, persistencia tras refrescar, historial, logout, credenciales incorrectas y login correcto conservando saldo.
2. Rechazo de tarjeta, fallo interno, timeout y desconexión: saldo sin incremento en todos los casos.
3. Datos locales corruptos: mensaje visible y conservación del contenido original.
4. Sincronización de saldo y logout entre dos pestañas; modal sin cambio de ruta, foco contenido, cierre con Escape, devolución del foco al botón y cierre visible al desplazar el formulario. Durante una recarga en curso no se permite cerrar el modal.
5. Ventana completa, marca y cierre fijos, menú de dos opciones y scroll del contenido, incluido un viewport de poca altura. Las rutas retiradas vuelven al dashboard.

Playwright utiliza un perfil aislado por prueba. Los datos de prueba no crean cuentas en el navegador habitual del usuario. Los screenshots y trazas quedan excluidos de Git. En esta máquina, las pruebas de integración y navegador necesitaron permiso para abrir sockets y procesos locales; los fallos iniciales de sandbox no se confundieron con errores del producto.

## Ajustes derivados de la revisión

- Se redujo la tipografía de las etiquetas del eje horizontal para que los seis nombres no se encimen en móvil.
- Se aumentó el contraste de textos secundarios.
- El dashboard se carga por separado del acceso, reduciendo el JavaScript inicial.
- El adaptador del navegador se separó de los componentes para evitar dependencias circulares.

## Lo que no está validado

Publicación en GitHub, despliegue público, Safari, dispositivos físicos, seguridad de autenticación de producción, base de datos SQL, persistencia durable del servidor y conciliación con pagos reales. Son límites explícitos, no resultados inferidos de una compilación o un test.

## Interfaz ajustada al alcance

El sidebar contiene únicamente Dashboard y Cargar saldo, con la marca fija arriba y Cerrar sesión fijo abajo. El dashboard reúne nombre del usuario, saldo, donut de apuestas ganadas/perdidas, barras de victorias y acceso a SnailPay. La página de recarga conserva el formulario y el historial con filtros. No hay secciones independientes de apuestas, estadísticas, carreras o caracoles. Las rutas retiradas redirigen al dashboard.

Se conserva la paleta, tipografía y estilo visual de la referencia. Se retiraron las tarjetas de navegación redundantes, la búsqueda y las notificaciones. La aplicación ocupa toda la ventana y el contenido tiene scroll propio. Los diez recorridos de navegador comprueban ambas gráficas en el dashboard, recargas, persistencia, errores, navegación, sesión y ajuste al viewport en escritorio y móvil. Se revisaron capturas de ambas vistas. No se modificaron contratos de API, credenciales ni persistencia.

## Formulario compartido y modal

El formulario se reutiliza en la página Cargar saldo y en el modal del dashboard. Ambos presentan monto, saldo, datos ficticios, selección de escenario y resultado. El modal utiliza el elemento nativo dialog, bloquea la interacción con el fondo, mantiene el encabezado y el cierre visibles y adapta su contenido a una columna en móvil. Se revisaron capturas de página y modal. La compilación y los 10 recorridos E2E pasaron; tras fijar el cierre móvil se repitieron los cuatro recorridos de recarga y foco afectados.

## Comprobación de entrega

Se repitió `npm run verify`: compilación, 30 pruebas de lógica/API en cuatro archivos y 10 recorridos E2E aprobados. También se ejecutaron `npm ci` y `npm run build` desde una copia limpia del proyecto, sin reutilizar node_modules, y se comprobó el servidor compilado de esa copia con las rutas SPA y el 404 de API. La instalación requirió descargar las dependencias fijadas desde npm porque el caché local estaba incompleto.

Los cinco comandos `npm run demo:snailpay -- ...` fueron ejecutados contra el API local. Resultados: approved 200, declined 422, system-error 503, timeout 504 e invalid 400. Son verificaciones de la API; las pruebas E2E comprueban por separado los cambios del saldo del navegador.
