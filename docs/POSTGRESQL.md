# Propuesta de PostgreSQL

Estado: diseño documentado. No hay conexión, ORM, contenedor de PostgreSQL ni migraciones ejecutadas. El objetivo es conservar LocalStorage en la versión actual y facilitar una evolución controlada.

## Qué ya queda preparado

1. Tipos y esquemas de solicitud/respuesta compartidos en `packages/contracts`.
2. Componentes separados de servicios de acceso, saldo y transporte HTTP.
3. `AccountRepository` y `LocalAccountRepository` para aislar lectura/escritura local.
4. Importes internos en centavos, identificadores UUID y referencias de operación explícitas.
5. Express desacoplado de su listener para pruebas de integración.
6. Pruebas de invariantes que podrán reutilizarse al cambiar la implementación.

La abstracción actual almacena una cuenta como agregado local. Una versión remota no enviará ese agregado ni su saldo desde el navegador: sustituirá las operaciones de cuenta por llamadas a endpoints de negocio. El repositorio SQL vivirá únicamente en Express. Es una evolución explícita, no una promesa de cambiar una variable y obtener seguridad.

## Entidades propuestas

| Entidad              | Campos relevantes                                                                                                    | Relaciones y restricciones                                                                                           |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| users                | id UUID, name, email, password_hash, created_at                                                                      | email normalizado y único; el hash se genera en el servidor                                                          |
| sessions             | id, user_id, token_hash, expires_at, revoked_at                                                                      | N sesiones por usuario; revocación y expiración en servidor                                                          |
| wallets              | id, user_id, currency, balance_cents, updated_at                                                                     | 1 por usuario/moneda; `balance_cents >= 0`; MXN inicialmente                                                         |
| payment_transactions | id, wallet_id, reference, provider_operation_id, status, amount_cents, status_detail, authorization_code, created_at | N movimientos por wallet; referencia única por wallet; operación del proveedor única cuando exista; importe positivo |

Dinero en enteros de centavos, con límites explícitos. Si se utiliza BIGINT, serializarlo como cadena decimal o comprobar el rango seguro antes de convertir a `number` en JavaScript. Timestamps `timestamptz`. FK en todas las relaciones. Índice para listar movimientos por wallet y fecha.

No se almacenarán CVV ni PAN completo. Con una pasarela real solo se guardarían identificadores del proveedor, marca y últimos cuatro dígitos cuando proceda. Los datos de tarjetas ficticias de la demo no forman parte del modelo financiero futuro.

Las seis carreras pueden continuar como fixtures. Solo si el producto requiere historial de carreras se añadirían `snails`, `races` (con `winner_snail_id`) y `bets` (usuario, carrera, selección y resultado). No se propone implementar un motor de apuestas.

## Nuevos límites de autoridad

- El navegador enviará solicitudes de registro, login, consulta de perfil y recarga; nunca un saldo que el servidor deba aceptar.
- Express validará credenciales y derivará `payer_id` y `payer_email` de la sesión autenticada, no del cuerpo recibido.
- Sesión mediante cookie HttpOnly/Secure/SameSite, revocación en logout, expiración y protección CSRF acorde con el despliegue.
- Hash de contraseñas en servidor con Argon2id o una derivación equivalente correctamente parametrizada. No se importarán los verificadores locales como credenciales confiables.
- `GET /api/me`, `GET /api/wallet`, `GET /api/payments`, `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout` y `POST /api/wallet/top-ups` serían los endpoints de negocio.
- `DATABASE_URL` estará solo en variables del backend. El frontend no tendrá credenciales SQL.

## Recarga consistente

Crear primero una operación pendiente con referencia única. La llamada al proveedor ocurre fuera de una transacción SQL larga. Después de confirmar el resultado, abrir una transacción corta, bloquear el movimiento y la wallet, comprobar que no se aplicó antes, actualizar el estado y sumar el importe si corresponde, y confirmar ambos cambios juntos.

Ante error, revertir la transacción. Una confirmación repetida no incrementa el saldo. Un timeout real deja el estado pendiente de conciliación, sin reintentar a ciegas ni asumir rechazo: consultar al proveedor por la misma referencia y verificar webhooks autenticados si existen. Este tratamiento difiere deliberadamente del escenario ficticio de timeout, que siempre termina en error conocido.

PostgreSQL permite agrupar los cambios con BEGIN/COMMIT y restricciones únicas. Referencia: https://www.postgresql.org/docs/current/tutorial-transactions.html

## Pasos de integración posteriores

1. Elegir driver `pg` o un ORM, preparar migraciones versionadas y pruebas con una instancia desechable.
2. Implementar repositorios de servidor y servicios de autenticación/wallet.
3. Reemplazar el servicio de cuenta del navegador por un cliente HTTP manteniendo los componentes.
4. Ejecutar las mismas pruebas de acceso, errores y dinero; añadir concurrencia, reintentos después de reiniciar, rollback, expiración y aislamiento entre usuarios.
5. Mantener los datos locales como demo o pedir un registro nuevo. No importar saldos del cliente como valor autorizado.

## Criterio de finalización futuro

Dos solicitudes simultáneas con la misma referencia deben producir un único movimiento y un único incremento, incluso tras reiniciar el API. Usuarios distintos no pueden consultar ni alterar wallets ajenas. Saldo y movimientos deben mantener su consistencia ante cualquier error de escritura.
