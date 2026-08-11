/**
 * Swagger UI HTML for API Documentation
 */

export function getSwaggerUIHtml(specUrl: string): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <title>SentinelFlow API Documentation</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@3/swagger-ui.css">
    <style>
      html {
        box-sizing: border-box;
        overflow: -moz-scrollbars-vertical;
        overflow-y: scroll;
      }
      *, *:before, *:after {
        box-sizing: inherit;
      }
      body {
        margin: 0;
        padding: 0;
        font-family: sans-serif;
      }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@3/swagger-ui-bundle.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@3/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = function() {
        const ui = SwaggerUIBundle({
          url: "${specUrl}",
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset
          ],
          plugins: [
            SwaggerUIBundle.plugins.DownloadUrl
          ],
          layout: "StandaloneLayout",
          defaultModelsExpandDepth: 1,
          defaultModelExpandDepth: 1,
          tryItOutEnabled: true,
        });
        window.ui = ui;
      };
    </script>
  </body>
</html>
  `;
}

export function getReDocHtml(specUrl: string): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <title>SentinelFlow API Documentation</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: 'Roboto', sans-serif;
      }
    </style>
  </head>
  <body>
    <redoc spec-url='${specUrl}'></redoc>
    <script src="https://cdn.jsdelivr.net/npm/redoc@latest/bundles/redoc.standalone.js"></script>
  </body>
</html>
  `;
}
