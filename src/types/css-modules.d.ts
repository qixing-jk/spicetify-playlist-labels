// This declaration file allows TypeScript to understand CSS module imports.
// When you import a .module.css file, it will be treated as a module
// that exports an object where keys are class names and values are the generated unique class names.
declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

// This declaration file does the same for SCSS modules.
declare module "*.module.scss" {
  const classes: { [key: string]: string };
  export default classes;
}
