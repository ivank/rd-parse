export type Token = any;

export interface Context {
  pos: number;
  line: number;
  column: number;
}

export interface Stack {
  pos: number;
  lastSeen: Context;
  ignore: (FunctionRule | null)[];
  text: string;
  sp: number;
  stack: Token[];
}

export type FunctionRule = ($: Stack) => Stack;
export type Rule = FunctionRule | RegExp | string;
