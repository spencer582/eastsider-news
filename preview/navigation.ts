import { getPathname } from "./runtime";
export const usePathname = () => getPathname();
export function notFound(): never { throw new Error("PREVIEW_NOT_FOUND"); }
