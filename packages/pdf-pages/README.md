# @tsgi-web/pdf-pages

Renders every page of a PDF to a JPEG and extracts its text layer, one page at a time, so only one canvas is in memory. Used by the TSG-Echo render route (`apps/web/src/app/api/echo/render`) and the archive import (WEB-354).

Built on `pdfjs-dist` and `@napi-rs/canvas`, which ships a native binary. A Next.js app that uses this package has to list both in `serverExternalPackages`.
