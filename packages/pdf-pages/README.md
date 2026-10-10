# @tsgi-web/pdf-pages

Renders every page of a PDF to a JPEG and extracts its text layer, one page at a time, so only one canvas is in memory. Used by the TSG-Echo render route (`apps/web/src/app/api/echo/render`) and the archive import (WEB-354).

Built on `pdfjs-dist` and `@napi-rs/canvas`, which ships a native binary. A Next.js app that uses this package has to list both in `serverExternalPackages`.

pdf.js reads its WebAssembly decoders, fonts, CMaps and ICC profiles from the `pdfjs-dist` directory at runtime; black-and-white scans come out blank without them. Outside a bundle `renderPdfPages` finds that directory itself. Inside a Next.js bundle the caller passes it as `dataDir` and ships it with `outputFileTracingIncludes` (see `apps/web/src/lib/echo/pdfjs-data.ts`).
