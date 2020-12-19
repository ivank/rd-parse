import { Stack } from './types';

export class ParserError extends Error {
  public constructor(message: string, public parseStack: Stack) {
    super(message);
  }
}
