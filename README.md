# Snail Club

Aplicación de demostración de carreras de caracoles. React + Express + TypeScript, con registro local, dashboard, saldo y una pasarela ficticia llamada SnailPay.

## Ejecutar en desarrollo

Requisitos: Node.js 22.12 o posterior y npm. Versión validada localmente: Node.js 24.15.

```sh
npm ci
npm run dev
```

- Interfaz: http://127.0.0.1:5173
- API: http://127.0.0.1:3001/api/health
- Detener ambos procesos: Ctrl+C.
- No se necesita una base de datos, credenciales externas ni archivos adjuntos.
- Crea una cuenta con nombre, correo y una contraseña de al menos 10 caracteres. Solo hay una cuenta por navegador/origen. Usa una contraseña exclusiva de demostración.
- Vite redirige `/api` hacia Express. Usa siempre el mismo origen: `localhost` y `127.0.0.1`, o puertos distintos, tienen almacenamientos separados.

Opcionalmente copia `.env.example` a `.env`. El puerto de API predeterminado es 3001; si se cambia en desarrollo, hay que actualizar también el proxy de `vite.config.ts`. `SNAILPAY_MODE=system_error` fuerza el fallo global de la pasarela y prevalece sobre cualquier aprobación cacheada. Reinicia la API después de cambiar `.env`.

## Compilar y ejecutar la compilación

```sh
npm run build
npm start
```

La compilación incluye verificación de tipos, frontend y backend. Express sirve ambos desde http://127.0.0.1:3001, incluyendo las rutas del cliente al recargar. Al cambiar del puerto de desarrollo al de compilación, tendrás que registrar otra cuenta por tratarse de otro origen. La aplicación escucha solo en loopback de forma predeterminada.

## Pruebas

```sh
npm test
npx playwright install chromium
npm run test:e2e
```

Playwright levanta automáticamente los servidores de desarrollo si no están en ejecución. Necesita permisos para abrir puertos locales y Chromium. El proyecto móvil utiliza Chromium con tamaño y entrada táctil de iPhone 13; no constituye una validación en Safari ni en un dispositivo físico.

```sh
npm run verify
npm run format:check
npm run test:production
```

`verify` compila y ejecuta ambas suites. `test:production` comprueba la compilación existente abriendo temporalmente el puerto 3002 y lo libera al terminar. Las pruebas cubren autenticación, persistencia, operaciones monetarias, rechazos, errores, timeout, contratos, duplicados y datos corruptos. Los resultados concretos están en [docs/VALIDACION.md](docs/VALIDACION.md).

## Funcionalidades

- Registro con confirmación de contraseña, login, logout y rutas protegidas por sesión local.
- Perfil, sesión, saldo y respuestas de SnailPay persistidos en LocalStorage.
- Contraseña derivada con PBKDF2-SHA256, sal aleatoria de 16 bytes y 210 000 iteraciones. Nunca se persiste la contraseña original.
- Saldo inicial de $0.00 MXN, cálculo interno en centavos y escritura conjunta del saldo y movimiento.
- Donut de 4 apuestas ganadas y 2 perdidas. Barras con seis caracoles y seis victorias totales, derivadas de seis carreras fijas.
- Recarga con aprobación, tarjeta rechazada, fallo interno y timeout controlado.
- Historial local de respuestas. Los errores de transporte no inventan una respuesta ni un movimiento aprobado.
- Interfaz que ocupa toda la ventana. La marca y el cierre de sesión permanecen fijos en el menú; el contenido central y la navegación se desplazan por separado.
- Dos vistas: Dashboard, con saldo y ambas gráficas, y Cargar saldo, con formulario e historial de SnailPay. El botón del dashboard abre una recarga modal sin cambiar de ruta; el modal y la página comparten el mismo formulario. Formularios etiquetados y soporte para movimiento reducido.

## Jornada simulada

Las estadísticas representan un único día de ejemplo, sin fecha de calendario. No cambian al recargar ni al pasar al siguiente día real. Hay seis caracoles y seis carreras con un ganador cada una: Meteoro gana las carreras 1, 3 y 6; Lechuga la 2; Turbo la 4; Canela la 5. Rayo y Pistacho no ganan. La gráfica deriva sus valores de esas seis carreras, cuya suma de victorias es seis. El donut muestra cuatro apuestas ganadas y dos perdidas.

No hay selector de fechas, historial de jornadas, aleatoriedad ni motor que ejecute carreras. Estos elementos no se requieren para representar el día simulado. Los datos están en `apps/web/src/services/fixtures.ts`.

## Probar SnailPay

Abre **Cargar saldo** desde el menú (página con historial) o desde el dashboard (modal). En ambos casos selecciona un **Escenario de prueba**. Los datos ficticios se completan automáticamente y son de solo lectura. El monto y el titular son editables.

| Escenario         | Datos / selector                                                       | Resultado                                                                    |
| ----------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Aprobado          | `1234123412341234`, `12/26`, `543`; titular no vacío; monto positivo   | HTTP 200, `approved`, saldo incrementado                                     |
| Rechazado         | `1111111111111111`, `12/26`, `111`                                     | HTTP 422, `rejected`, sin incremento                                         |
| Error del sistema | Selector `Servicio no disponible`, `scenario=system_error`             | HTTP 503, `error`, sin incremento                                            |
| Timeout           | Selector `Tiempo de espera agotado`, `scenario=timeout`                | Cliente cancela a los 3.5 s; servidor responde 504 a los 6 s y nunca aprueba |
| Datos inválidos   | Por API: monto cero, negativo, más de dos decimales, datos incompletos | HTTP 400, `rejected`, sin incremento                                         |
| Sin conexión      | Detener la API y enviar una recarga                                    | Mensaje de conexión o respuesta inválida del proxy, sin incremento           |

La fecha de la tarjeta exitosa es una fixture fija, no se valida contra el calendario ni con Luhn. El monto válido es de $0.01 a $1,000,000.00 MXN. No se aceptan ni se reflejan números de tarjeta o CVV fuera de la lista ficticia. Las respuestas válidas incluyen y persisten esos valores de prueba; no constituyen un diseño para pagos reales.

También puedes reproducir los escenarios por terminal con `npm run demo:snailpay -- approved` (o `declined`, `system-error`, `timeout`, `invalid`). Las llamadas al API no modifican el saldo del navegador.

Contrato completo, ejemplo y errores: [docs/SNAILPAY.md](docs/SNAILPAY.md).

## Organización y futura base de datos

- `apps/web/src/components`: pantallas y componentes.
- `apps/web/src/services`: autenticación local, pagos, fixtures y formato de moneda.
- `apps/web/src/storage`: contrato del repositorio y adaptador de LocalStorage.
- `apps/api/src`: aplicación Express separada del proceso que la escucha.
- `packages/contracts/src`: esquemas Zod y tipos compartidos.
- `tests/e2e`: flujos completos en navegador.
- `docs`: contratos, decisiones y validación.

Los componentes no leen ni escriben LocalStorage directamente. Los servicios aíslan persistencia y transporte. No hay PostgreSQL conectado: la propuesta de entidades, límites de responsabilidad y cambios necesarios está en [docs/POSTGRESQL.md](docs/POSTGRESQL.md). Cambiar el adaptador por sí solo no convierte la autenticación o el saldo en seguros; esa autoridad debe trasladarse a Express.

## Límites conocidos

Esta es una simulación local, sin dinero real ni autenticación de servidor. Quien controle el navegador puede modificar sus datos; el hash no protege contra scripts con acceso al mismo origen. Borrar los datos del sitio elimina la cuenta. No hay recuperación de contraseña, verificación de correo ni administración multiusuario.

El caché de idempotencia de SnailPay está en memoria, admite 1 000 referencias y se pierde al reiniciar la API. El cliente evita duplicar una referencia ya registrada. Web Locks serializa actualizaciones entre pestañas cuando está disponible; sin él, solo se serializan dentro de una instancia de la aplicación. Si una escritura local falla, no se informa un saldo actualizado; no existe reconciliación durable después de un cierre inesperado. Todos estos límites se resuelven en la propuesta de persistencia del servidor.

No se guardan tarjetas reales ni se conectan pasarelas externas. No se generan apuestas o carreras ejecutables. No se ha desplegado públicamente ni conectado una base de datos.

## Herramientas y autoría

Se utilizó IA de principio a fin mediante Codex para análisis técnico, arquitectura, diseño, código, pruebas y documentación. El responsable leyó personalmente el documento de requisitos y fue guiando el desarrollo, revisando resultados y solicitando ajustes. La implementación del código, las pruebas y los documentos se realizó con IA. Tiempo aproximado invertido: 5 horas, según la estimación del responsable. Interfaz implementada en CSS tomando como base una referencia visual proporcionada por el usuario: menú lateral, barra superior, panel central, colores suaves y tarjetas de contenido. Se adaptaron los contenidos a saldo, recargas y estadísticas; no se utilizó una plantilla descargada. Se utilizaron Vite, React Router, Recharts, Zod, Phosphor Icons, la fuente DM Sans, Vitest, Supertest, Playwright y Prettier. La fuente se sirve localmente. Las gráficas se adaptaron a la interfaz; no se atribuye como desarrollo manual lo generado con IA.

El documento de respuesta se genera con Python/ReportLab y Arial. El uso de IA, las decisiones y las limitaciones están detallados en [docs/RESPUESTA.md](docs/RESPUESTA.md).

## Preparación de la entrega pública

El repositorio local está inicializado en `main`, sin commits ni remoto. Falta confirmar la identidad de autor de Git y publicar en GitHub. Nombre preparado: `alberto-4181`; disponibilidad sin comprobar. El documento de requisitos y los datos locales no se incluyen en los archivos publicables. El PDF sigue como borrador hasta añadir una URL pública verificada. El despliegue de la aplicación se atenderá después.

Estado de los entregables: [docs/ENTREGA.md](docs/ENTREGA.md). Guía del código y de las decisiones: [docs/GUIA_CODIGO.md](docs/GUIA_CODIGO.md).

## Regenerar el PDF

El borrador está en `output/pdf/respuesta-snail-club.pdf`. Su fuente editable es `docs/RESPUESTA.md`. Para regenerarlo: instala Python 3 y `reportlab`, y ejecuta `python3 scripts/generate-response-pdf.py`. Requiere Arial regular y negrita; en macOS se usan las fuentes del sistema. En otro sistema define `ARIAL_REGULAR` y `ARIAL_BOLD` con las rutas de sus archivos TTF. Revisa el resultado visualmente antes de enviarlo.
