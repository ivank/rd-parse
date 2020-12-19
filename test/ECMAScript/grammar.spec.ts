import { Parser } from '../../src';
import Grammar from '../../examples/ECMAScript';

const parser = Parser(Grammar);

describe('ECMAScript test', () => {
  it('shuld parse empty input', () => {
    expect(() => parser('')).toThrowError(new Error('Unexpected token at 1:1. Remainder: '));
  });

  it('shuld parse faulty input', () => {
    expect(() => parser('a + \n]')).toThrowError(new Error('Unexpected token at 2:1. Remainder: ]'));
  });

  it('shuld parse Identifier', () => {
    const ast = parser(' bla ');
    expect(ast).toEqual({ type: 'Identifier', name: 'bla' });
    expect(ast.pos).toBe(1);
  });

  it('shuld parse boolean literals', () => {
    const ast = parser('false || true');
    expect(ast).toMatchSnapshot();
  });

  it('shuld parse a string literal', () => {
    const ast = parser(' "bla \\" bla" ');
    expect(ast).toEqual({ type: 'Literal', value: 'bla " bla', raw: '"bla \\" bla"' });
  });

  it('shuld parse a number literal', () => {
    const ast = parser(' 5e2 ');
    expect(ast).toEqual({ type: 'Literal', value: 500, raw: '5e2' });
  });

  it('shuld parse operator precedence', () => {
    const ast = parser('x*x + y*y');
    expect(ast).toMatchSnapshot();
  });

  it('shuld parse left associativity', () => {
    const ast = parser('a + b - c');
    expect(ast).toMatchSnapshot();
  });

  it('shuld parse exponentiation operator (right associativity)', () => {
    const ast = parser('a ** b ** c / 2');
    expect(ast).toMatchSnapshot();
  });

  it('shuld parse ArrowFunction, simple', () => {
    const ast = parser('x => x * x');
    expect(ast.type).toBe('ArrowFunction');
    expect(ast.parameters.bound.length).toBe(1);
    expect(ast.parameters.bound[0]).toEqual({ type: 'Identifier', name: 'x' });
    expect(ast.parameters.rest).toBe(undefined);
    expect(ast.result.type).toBe('BinaryExpression');
  });

  it('shuld parse ArrowFunction, with initializer and rest parameter', () => {
    const ast = parser('(c = 1, ...a) => c + a.length');
    expect(ast.type).toBe('ArrowFunction');
    expect(ast.parameters.bound.length).toBe(1);
    expect(ast.parameters.bound[0].initializer).toEqual({ type: 'Literal', value: 1, raw: '1' });
    expect(ast.parameters.rest).toEqual({ type: 'Identifier', name: 'a' });
    expect(ast.parameters.rest.pos).toBe(11);
  });

  it('shuld parse template literals', () => {
    const ast = parser('`${a} + ${b} is ${a + b}`');
    expect(ast.type).toBe('TemplateLiteral');
    expect(ast.parts[0]).toEqual(['expressions', { type: 'Identifier', name: 'a' }]);
    expect(ast.parts[1]).toEqual(['chunks', ' + ']);
    expect(ast.parts[2]).toEqual(['expressions', { type: 'Identifier', name: 'b' }]);
    expect(ast.parts[3]).toEqual(['chunks', ' is ']);
    expect(ast.parts[4][1].type).toBe('BinaryExpression');
  });

  it('shuld parse template litarals 2', () => {
    const input = '`Mismatched timing labels (expected ${this.current_timing.label}, got ${label})`';
    expect(parser(input)).toMatchSnapshot();
  });
});
