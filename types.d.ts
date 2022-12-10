declare module 'sqlite-parser' {
  export default function (sql: string): SQLFileParserReturnType
}

interface OnShutdown {
  (handler: () => void): void
  (name: string, handler: () => void): void
  (name: string, dependencies: readonly string[], handler: () => void): void
  (handler: () => Promise<void>): void
  (name: string, handler: () => Promise<void>): void
  (name: string, dependencies: readonly string[], handler: () => Promise<void>): void
}

//The typing is wrong (missing sync function signatures), so overriding
declare module 'node-graceful-shutdown' {
  const onShutdown: OnShutdown
}
