# Despliegue en servidor propio con DuckDNS

La web compilada y el API se ejecutan juntos en un contenedor. Caddy publica
HTTPS y conecta con `127.0.0.1:4334`. No se necesita PostgreSQL para esta entrega.

## Construir y arrancar

Desde la raíz del proyecto, con Docker y Docker Compose instalados:

```sh
docker compose up -d --build
docker compose ps
curl --fail http://127.0.0.1:4334/api/health
```

El puerto 4334 debe estar libre. Solo se expone en la interfaz local del servidor.
El proceso del contenedor usa `HOST=0.0.0.0`; fuera de Docker conserva por defecto
`127.0.0.1`. El contenedor se reinicia automáticamente tras reinicios del servidor.

## Nombre público y HTTPS

1. Iniciar sesión en DuckDNS y registrar un subdominio disponible.
2. Apuntar su registro IPv4 a la IP pública del servidor.
3. Comprobar que el nombre resuelva correctamente y que 80 y 443 sean accesibles.
4. En un servidor cuyo Caddyfile importe `/etc/caddy/conf.d/*.caddy`, ejecutar:

```sh
sudo bash scripts/enable-duckdns-site.sh NOMBRE.duckdns.org
```

El script añade únicamente `snail-club.caddy`, valida la configuración completa y
recarga Caddy. Si el archivo ya existe, se detiene para evitar sobrescribirlo.
El nombre es un ejemplo: sustituirlo por el subdominio realmente registrado.
El token de DuckDNS no se guarda en el repositorio ni en la imagen de Docker.

Verificar luego `/api/health`, `/acceso`, el registro y una recarga simulada desde
la URL HTTPS. La aplicación usa Web Crypto y requiere un contexto seguro en el
navegador. Los datos locales pertenecen al navegador y al origen: al cambiar de
dominio no se trasladan automáticamente.

## Operación

```sh
docker compose logs --tail=100 app
docker compose up -d --build
```

La carpeta de despliegue preparada en `contabo-crm-admin` es
`/home/albertoadmin/snail-club`. El estado público solo se considera verificado
después de comprobar DNS, certificado HTTPS y el flujo de la aplicación.
