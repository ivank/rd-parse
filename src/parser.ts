import { ParserError } from './ParserError';
import { Context, Stack, FunctionRule, Rule, Token } from './types';

function locAt(text: string, newPos: number, { pos, line, column }: Context): Context {
  while (pos < newPos) {
    const ch = text[pos++];
    if (ch === '\n') {
      column = 1;
      line++;
    } else column++;
  }
  return { pos, line, column };
}

function scanIgnore($: Stack): void {
  if ($.ignore.length) {
    const toIgnore = $.ignore[$.ignore.length - 1];
    const $next = toIgnore ? toIgnore($) : $;

    $.pos = $next.pos;
  }
  if ($.pos > $.lastSeen.pos) {
    Object.assign($.lastSeen, locAt($.text, $.pos, $.lastSeen));
  }
}

export function RegexToken(pattern: RegExp): FunctionRule {
  return ($) => {
    scanIgnore($);

    const match = pattern.exec($.text.substring($.pos));
    if (!match) return $;

    // Token is matched -> push all captures to the stack and return the match
    const $next = { ...$, pos: $.pos + match[0].length };

    for (let i = 1; i < match.length; i++) {
      $.stack[$next.sp++] = match[i];
    }

    return $next;
  };
}

export function StringToken(pattern: string): FunctionRule {
  return ($) => {
    scanIgnore($);
    return $.text.startsWith(pattern, $.pos) ? { ...$, pos: $.pos + pattern.length } : $;
  };
}

export function Use(rule: Rule): FunctionRule {
  if (typeof rule === 'function') return rule;
  if (rule instanceof RegExp) return RegexToken(rule);
  if (typeof rule === 'string') return StringToken(rule);
  throw new Error('Invalid rule');
}

export function Ignore(toIgnore: RegExp | null, rule: Rule): FunctionRule {
  const functionRule = Use(rule);
  const toFunctionIgnore = toIgnore ? Ignore(null, Plus(toIgnore)) : null;

  return ($) => {
    $.ignore.push(toFunctionIgnore);
    const $next = functionRule($);

    scanIgnore($next);
    $.ignore.pop();

    return $next;
  };
}

/**
 * Match a sequence of rules left to right
 */
export function All(...rules: Rule[]): FunctionRule {
  const functionRules = rules.map(Use);

  return ($) => {
    let $cur = $;
    for (let i = 0; i < functionRules.length; i++) {
      const $next = functionRules[i]($cur);
      if ($next === $cur) return $; // if one rule fails: fail all
      $cur = $next;
    }
    return $cur;
  };
}

/**
 * Match any of the rules with left-to-right preference
 */
export function Any(...rules: Rule[]): FunctionRule {
  const functionRules = rules.map(Use);

  return ($) => {
    for (let i = 0; i < functionRules.length; i++) {
      const $next = functionRules[i]($);
      if ($next !== $) return $next; // when one rule matches: return the match
    }
    return $;
  };
}

/**
 * Match a rule 1 or more times
 */
export function Plus(rule: Rule): FunctionRule {
  const functionRule = Use(rule);

  return ($) => {
    let $cur: Stack, $next: Stack;
    for ($cur = $; ($next = functionRule($cur)) !== $cur; $cur = $next);
    return $cur;
  };
}

/**
 * Match a rule optionally
 */
export function Optional(rule: Rule): FunctionRule {
  const functionRule = Use(rule);

  return ($) => {
    const $next = functionRule($);
    if ($next !== $) return $next;

    // Otherwise return a shallow copy of the state to still indicate a match
    return { ...$ };
  };
}

/**
 * Use the Node helper to define how to build your AST. It has two arguments: the rule to match, and a reducer callback: see below.
 * Each regex matching rule will dump all capturing groups matches from its regex to a stack in the matched order. If a rule is wrapped in a Node, the parser will call the provided reducer passing an Array, containing everything that the matched rule has put onto the stack.
 * The reducer returns an object to be put back onto the stack for the parent nodes to pick up later.
 */
export function Node<T extends Token = Token>(
  rule: Rule,
  reducer: (values: Token[], $: Stack, $next: Stack) => T,
): FunctionRule {
  const functionRule = Use(rule);

  return ($) => {
    const $next = functionRule($);
    if ($next === $) return $;

    // We have a match
    const node = reducer($.stack.slice($.sp, $next.sp), $, $next);
    $next.sp = $.sp;
    if (node !== null) $.stack[$next.sp++] = node;

    return $next;
  };
}

/**
 * matches the argument rule zero or more times: `Star = rule => Optional(Plus(rule)).`
 */
export function Star(rule: Rule): FunctionRule {
  return Optional(Plus(rule));
}

/**
 * Y combinator: often useful to define recursive grammars
 */
export function Y(proc: (x: FunctionRule) => FunctionRule): FunctionRule {
  return ((x) => proc((y) => x(x)(y)))((x: any) => proc((y) => x(x)(y)));
}

function START(text: string, pos = 0): Stack {
  return {
    text,
    ignore: [],
    stack: [],
    sp: 0,
    lastSeen: locAt(text, pos, { pos: 0, line: 1, column: 1 }),
    pos,
  };
}

export function Parser<T extends Token = Token>(Grammar: FunctionRule, pos = 0, partial = false) {
  return (text: string): T | undefined => {
    const $ = START(text, pos);
    const $next = Grammar($);

    if ($ === $next || (!partial && $next.pos < text.length)) {
      // No match or haven't consumed the whole input
      throw new ParserError(
        `Unexpected token at ${$.lastSeen.line}:${$.lastSeen.column}. Remainder: ${text.slice($.lastSeen.pos)}`,
        $,
      );
    }

    return $.stack[0] as T;
  };
}
