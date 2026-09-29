# SnailPay: contrato de simulación

## Solicitud

`POST /api/snailpay/payments`, JSON. No necesita autorización de servidor: el acceso de esta demo es local y el API no acredita una cuenta real.

```json
{
  "card_number": "1234123412341234",
  "expiration": "12/26",
  "cvv": "543",
  "cardholder_name": "Usuario Demo",
  "transaction_amount": 200,
  "payer_id": "3108d53c-b54e-42c8-b841-4b81d2d8e56b",
  "payer_email": "demo@example.com",
  "reference": "067aee1e-bf5b-493d-841b-a973af164d99",
  "scenario": "normal"
}
```

`payer_id` y `payer_email` se toman del usuario registrado en la interfaz. UUID para usuario y referencia; correo con formato válido; titular de 1 a 120 caracteres después de recortar espacios; importe numérico de 0.01 a 1 000 000, máximo dos decimales. `scenario` admite `normal` (predeterminado), `system_error` o `timeout`.

Para probar directamente, con la API en marcha:

```sh
curl -i http://127.0.0.1:3001/api/snailpay/payments \
  -H 'Content-Type: application/json' \
  --data '{"card_number":"1234123412341234","expiration":"12/26","cvv":"543","cardholder_name":"Usuario Demo","transaction_amount":200,"payer_id":"3108d53c-b54e-42c8-b841-4b81d2d8e56b","payer_email":"demo@example.com","reference":"067aee1e-bf5b-493d-841b-a973af164d99","scenario":"normal"}'
```

Esta llamada demuestra el API; no modifica por sí sola el LocalStorage de ningún navegador. Para cada operación nueva usa una referencia UUID nueva. Repetir exactamente la misma solicitud reproduce la operación anterior mientras siga en el caché.

## Reproducir los escenarios desde terminal

Con la API iniciada mediante `npm run dev` o `npm start`, ejecutar en otra terminal:

```sh
npm run demo:snailpay -- approved
npm run demo:snailpay -- declined
npm run demo:snailpay -- system-error
npm run demo:snailpay -- timeout
npm run demo:snailpay -- invalid
```

Cada comando usa únicamente datos ficticios, genera identificadores nuevos e imprime el HTTP y la respuesta completa. Comprueba que el HTTP sea el esperado: 200, 422, 503, 504 o 400, respectivamente. El timeout espera unos seis segundos para mostrar la respuesta 504 del servidor; la interfaz cancela antes, a los 3.5 segundos. El modo global `SNAILPAY_MODE=system_error` debe estar desactivado para reproducir los demás resultados. Para otro puerto se puede definir `SNAILPAY_URL` con la URL completa del endpoint.

Estas llamadas no crean usuarios ni modifican el saldo del navegador. Para comprobar saldo e historial hay que reproducir los mismos escenarios desde el formulario. El HTTP 500 es una defensa ante excepciones inesperadas, no un escenario seleccionable; el error interno simulado y reproducible devuelve 503.

## Respuestas

| Campo                | Tipo / formato                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| `id`                 | UUID generado por el servidor                                                                     |
| `status`             | `approved`, `rejected` o `error`                                                                  |
| `status_detail`      | Código estable indicado abajo                                                                     |
| `transaction_amount` | Importe solicitado en MXN; 0 cuando no se puede representar un importe positivo válido de entrada |
| `date_created`       | ISO 8601 UTC                                                                                      |
| `authorization_code` | `SIM-` y ocho caracteres; `null` si no se aprueba                                                 |
| `reference`          | UUID de solicitud válida; cadena vacía si falta                                                   |
| `payer_id`           | UUID del usuario; cadena vacía si falta                                                           |
| `payer_email`        | Correo del usuario; cadena vacía si falta                                                         |
| `card_number`        | Solo uno de los números ficticios permitidos; `null` si no es reconocido                          |
| `cvv`                | Solo `543` o `111`; `null` si no es reconocido                                                    |

Todos los escenarios, incluidos JSON malformado y fallo interno, devuelven el mismo conjunto de campos. En errores sin un cuerpo utilizable, identificación, referencia y correo son cadenas vacías. El cuerpo tiene un límite de 8 KB.

| HTTP      | `status` | `status_detail`     | Cómo reproducir                                                                                                                     |
| --------- | -------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 200       | approved | accredited          | Fixture exacta de aprobación                                                                                                        |
| 422       | rejected | card_declined       | Tarjeta ficticia `1111111111111111`, CVV `111`, fecha `12/26`; también combinación conocida que no coincide con la fixture aprobada |
| 400       | rejected | invalid_data        | Importe 0 o campo requerido inválido                                                                                                |
| 503       | error    | service_unavailable | `scenario=system_error` o variable `SNAILPAY_MODE=system_error`                                                                     |
| 504       | error    | gateway_timeout     | `scenario=timeout`, con respuesta a los 6 s                                                                                         |
| 409       | error    | reference_conflict  | Misma referencia/usuario con otro monto o contenido                                                                                 |
| 400 / 413 | error    | invalid_request     | JSON malformado o cuerpo superior a 8 KB                                                                                            |
| 500       | error    | internal_error      | Excepción inesperada manejada por Express                                                                                           |

## Garantías de la demo

- El fallo global se evalúa antes del caché: no se devuelve una aprobación almacenada durante una caída simulada.
- Timeout nunca aprueba, aunque el navegador deje de esperar antes que el servidor.
- El cliente valida esquema, usuario, correo, referencia, importe y consistencia entre HTTP y estado antes de guardar.
- Saldo y movimiento se escriben en un único documento local. Repetir un ID o referencia no acredita otra vez.
- No se hacen reintentos automáticos. Doble clic se bloquea inmediatamente con una referencia de ejecución y el botón deshabilitado.
- En errores de red, respuestas inválidas o timeout del cliente, no se inventa una operación ni se modifica el saldo.
- Las tarjetas desconocidas no se reflejan ni se registran. No se registran cuerpos de solicitudes.
- Los mensajes visibles traducen los códigos a español.

## Alcance de idempotencia

El API conserva hasta 1 000 operaciones en memoria del proceso, indexadas por usuario y referencia. No es una garantía durable ni multiproceso. El navegador conserva referencias aplicadas en su historial. La propuesta SQL añade unicidad durable y actualización transaccional; no hay que extrapolar las garantías de este mock a una pasarela real.
