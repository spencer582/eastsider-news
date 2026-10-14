declare const __PREVIEW_BASE__: string;
declare const __PREVIEW_URL__: string;
declare const __PREVIEW_BUILT_AT__: string;
export const basePath = __PREVIEW_BASE__;
export const siteUrl = __PREVIEW_URL__;
export const builtAt = __PREVIEW_BUILT_AT__;
let pathname = "/";
export const setPathname = (value: string) => { pathname = value; };
export const getPathname = () => pathname;
export function publicPath(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return value;
  if (basePath !== "/" && (value === basePath.slice(0, -1) || value.startsWith(basePath))) return value;
  let path = value;
  if (path.startsWith("/api/events/ics/")) return basePath + "calendar/" + path.split("/").pop() + ".ics";
  const match = path.match(/^([^?#]*)(.*)$/)!;
  if (!/\.[a-z0-9]{2,6}$/i.test(match[1]) && !match[1].endsWith("/")) path = match[1] + "/" + match[2];
  return basePath + path.slice(1);
}
export function absoluteUrl(value: string): string {
  if (/^https?:\/\//.test(value)) return value;
  return new URL(publicPath(value.startsWith("/") ? value : "/" + value), new URL(siteUrl).origin).href;
}
