// Project-wide module shims for packages without TypeScript declarations
declare module "react-simple-maps" {
  export const ComposableMap: any
  export const Geographies: any
  export const Geography: any
  export const Marker: any
  export const ZoomableGroup: any
  export default any
}

declare module "input-otp" {
  export const OTPInput: any
  export const OTPInputContext: any
  const _default: any
  export default _default
}

declare module "vaul" {
  export const Drawer: any
  const _default: any
  export default _default
}
