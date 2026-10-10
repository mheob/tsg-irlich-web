// The pnpm store names the pdfjs-dist directory after this version; the render route needs it to
// find the data files inside a Next.js deployment.
export { version as PDFJS_VERSION } from 'pdfjs-dist/legacy/build/pdf.mjs';
export { renderPdfPages } from './render-pdf-pages';
export type { RenderOptions, RenderedPage } from './render-pdf-pages';
