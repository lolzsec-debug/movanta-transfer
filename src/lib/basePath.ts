// Inlined at build time; unoptimized next/image and plain <a> tags don't get
// the Next.js basePath automatically, so internal absolute URLs go through here.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const withBasePath = (path: string) =>
  path.startsWith("/") ? `${BASE_PATH}${path}` : path;
