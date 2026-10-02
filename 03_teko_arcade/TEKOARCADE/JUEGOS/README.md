# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Ejecutar TEKO JUEGOS en red local

1. Conectá la PC y el celular a la misma red Wi-Fi.
2. En `TEKO/JUEGOS/`, ejecutá `npm run dev:lan`.
3. Buscá en la salida de Vite la URL marcada como `Network`.
4. Abrí esa URL desde el navegador del celular.

Windows puede pedir permiso para Node/Vite en redes privadas. Permitilo en una red privada de confianza para acceder desde otros dispositivos.

Para probar el bundle optimizado, ejecutá `npm run build` y después `npm run preview:lan`. El preview sirve el resultado compilado y suele representar mejor la carga real que el servidor de desarrollo.
