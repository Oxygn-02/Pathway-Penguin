// The app code is plain JSX (no type checking); this lets the TypeScript entry point import it.
declare module "*.jsx" {
  const Component: import("react").ComponentType<any>;
  export default Component;
}
