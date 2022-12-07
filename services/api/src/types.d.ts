/*****
  .sql files parser return type
*****/
export interface SQLFileParserReturnType {
  readonly type: string
  readonly variant: string
  readonly statement: readonly Statement[]
}

export interface Statement {
  readonly type: string
  readonly name: Name
  readonly variant: string
  readonly format: string
  readonly definition: readonly Definition[]
  readonly condition: readonly Condition[]
}

export interface Name {
  readonly type: string
  readonly variant: string
  readonly name: string
}

export interface Definition {
  readonly type: string
  readonly variant: string
  readonly name: string
  readonly definition: readonly Definition2[]
  readonly datatype: Datatype
}

export interface Definition2 {
  readonly type: string
  readonly variant: string
  readonly collate?: Collate
  readonly expression?: Expression
}

export interface Collate {
  readonly collate: readonly Collate2[]
}

export interface Collate2 {
  readonly type: string
  readonly variant: string
  readonly name: string
}

export interface Expression {
  readonly type: string
  readonly format: string
  readonly variant: string
  readonly operation: string
  readonly right: Right
  readonly left: Left
}

export interface Right {
  readonly type: string
  readonly variant: string
  readonly expression?: readonly Expression2[]
  readonly value?: string
}

export interface Expression2 {
  readonly type: string
  readonly variant: string
  readonly value: string
}

export interface Left {
  readonly type: string
  readonly variant: string
  readonly name: string
}

export interface Datatype {
  readonly type: string
  readonly variant: string
  readonly affinity: string
}

export interface Condition {
  readonly type: string
  readonly variant: string
  readonly condition: Condition2
}

export interface Condition2 {
  readonly type: string
  readonly variant: string
  readonly operator: string
}

/*****
  end of .sql files parser return type
*****/
