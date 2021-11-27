import React from "react";

/**
 * React context for a [`Cache`]{@link Cache} instance.
 * @kind member
 * @name CacheContext
 * @type {object}
 * @prop {Function} Provider [React context provider component](https://reactjs.org/docs/context.html#contextprovider).
 * @prop {Function} Consumer [React context consumer component](https://reactjs.org/docs/context.html#contextconsumer).
 * @example <caption>How to `import`.</caption>
 * ```js
 * import CacheContext from "graphql-react/CacheContext.mjs";
 * ```
 */
const CacheContext = React.createContext();

if (typeof process === "object" && process.env.NODE_ENV !== "production")
  CacheContext.displayName = "CacheContext";

export default CacheContext;