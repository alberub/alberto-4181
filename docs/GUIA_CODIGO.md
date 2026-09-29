# Guía para entender y explicar la solución

Esta guía ayuda a revisar el código. No sustituye leerlo, ejecutarlo y poder modificarlo personalmente.

## Recorrido del registro y la sesión

1. `apps/web/src/components/Auth.tsx` recoge nombre, correo, contraseña y confirmación. No solicita archivos.
2. `packages/contracts/src/index.ts` define validaciones y tipos compartidos mediante Zod.
3. `apps/web/src/services/account.ts` valida, deriva la contraseña con sal aleatoria y PBKDF2, genera el usuario y crea saldo cero.
4. `apps/web/src/storage/repository.ts` valida el agregado de cuenta y lo escribe en LocalStorage. Sesión, saldo e historial pertenecen al mismo documento.
5. `apps/web/src/App.tsx` comprueba la sesión antes de mostrar las vistas. El logout elimina la sesión, conserva la cuenta y permite iniciar sesión de nuevo.

El API no autentica usuarios. La protección de rutas es local; quien controle el navegador puede alterar sus datos. El hash evita guardar la contraseña original, pero no transforma esta demo en un sistema de autenticación seguro en servidor.

## Recorrido de una recarga

1. `PaymentForm.tsx` se reutiliza en la página y dentro de `PaymentModal.tsx`. El modal no cambia la ruta del dashboard.
2. `services/payments.ts` valida la solicitud y envía los datos ficticios a Express. Tiene un límite de espera de 3.5 segundos.
3. `apps/api/src/app.ts` valida el contrato, aplica el escenario y devuelve aprobación, rechazo o error. El escenario de timeout tarda seis segundos y nunca aprueba.
4. El cliente verifica esquema, usuario, referencia, importe y que un HTTP fallido no contenga una aprobación antes de guardar.
5. `recordPayment` comprueba cuenta activa, propiedad de la operación y duplicados. Solo una aprobación incrementa el saldo.
6. El repositorio guarda el saldo y la operación juntos. React recibe el nuevo estado únicamente después de guardar correctamente. Una escritura fallida no muestra un saldo incrementado.

El saldo se calcula en centavos para evitar errores de sumas decimales. Las estadísticas simuladas no acreditan premios ni descuentan apuestas.

## Qué garantiza la idempotencia y qué no

El servidor recuerda hasta 1 000 operaciones en memoria por usuario/referencia y devuelve la misma respuesta ante una solicitud idéntica. Si cambia el contenido con la misma referencia, responde 409. El cliente evita registrar otra vez un ID o referencia ya recibido.

El caché se pierde al reiniciar y no se comparte entre procesos. PostgreSQL requeriría referencias únicas durables, transacciones y conciliación. Web Locks serializa cambios entre pestañas cuando está disponible; su alternativa solo serializa una instancia del servicio.

## Estadísticas

`services/fixtures.ts` contiene seis caracoles y seis carreras de un día de ejemplo. Las victorias se derivan de los ganadores, no se mantienen dos totales independientes. Meteoro gana tres veces y otros tres caracoles ganan una vez. No hay calendario ni motor de carreras.

## Por qué existen estas pruebas

| Archivo                 | Riesgo que comprueba                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| `account.test.ts`       | Registro/login, persistencia, centavos, duplicados, datos corruptos y fallo de escritura      |
| `payments.test.ts`      | Respuestas incompatibles, errores de transporte y timeout sin acreditar saldo                 |
| `app.test.ts`           | Contrato HTTP, escenarios, validación y repetición de referencias                             |
| `fixtures.test.ts`      | Seis participantes y seis carreras con estadísticas coherentes                                |
| `tests/e2e/app.spec.ts` | Flujo completo real en navegador: acceso, modal/página, saldo, errores, foco y sincronización |

## Preguntas que deberías poder responder

- ¿Dónde se decide si una operación aumenta el saldo y por qué no se decide en el componente?
- ¿Qué ocurre si se repite una respuesta, se cierra la sesión en otra pestaña o LocalStorage falla?
- ¿Por qué un timeout de esta demo puede tratarse como error conocido y uno real requeriría conciliación?
- ¿Qué cambia al mover las credenciales, las sesiones y la autoridad del saldo a Express/PostgreSQL?
- ¿Qué prueba modificarías si agregas un escenario de rechazo nuevo?

## Autoría y revisión

Se utilizó inteligencia artificial de principio a fin mediante Codex para el análisis técnico, la arquitectura, el diseño, el código, las pruebas y los documentos. El responsable leyó personalmente los requisitos y fue guiando el desarrollo de la aplicación: definió el alcance, aportó la referencia visual, revisó resultados y solicitó correcciones. No se presenta la implementación realizada con IA como escritura manual independiente.

Se trabajó con requisitos explícitos, separación de responsabilidades, contratos tipados, validaciones, pruebas automatizadas, revisión visual e instalación limpia. Estas comprobaciones aportan evidencia, sin garantizar ausencia de errores. No se utilizó Superpowers. La capacidad del responsable para explicar o modificar la solución requiere su comprensión personal y no queda demostrada por una prueba automática. Tiempo aproximado invertido: 5 horas, según su estimación.
