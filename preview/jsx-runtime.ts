import { jsx as originalJsx, jsxs as originalJsxs, Fragment } from "react/jsx-runtime";
import { publicPath } from "./runtime";
export { Fragment };
function propsFor(type: unknown, props: any) {
  if (typeof type !== "string" || !props) return props;
  const result = { ...props };
  for (const key of ["href", "src", "action", "poster"]) if (typeof result[key] === "string") result[key] = publicPath(result[key]);
  if (type === "img" && result.onError) {
    const onError = result.onError;
    result.onError = (event: any) => {
      onError(event);
      const source = event.currentTarget.getAttribute("src");
      if (source) event.currentTarget.setAttribute("src", publicPath(source));
    };
  }
  return result;
}
export const jsx = (type: any, props: any, key?: any) => originalJsx(type, propsFor(type, props), key);
export const jsxs = (type: any, props: any, key?: any) => originalJsxs(type, propsFor(type, props), key);
