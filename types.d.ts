declare module 'sqlite-parser' {
  export default function (sql: string): SQLFileParserReturnType
}

//The typing is wrong (missing sync function signatures), so overriding
declare module 'node-graceful-shutdown' {
  const onShutdown: OnShutdown
}
