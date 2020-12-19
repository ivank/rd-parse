# jsexpr

Javascript (ES2015) expression grammar, defined in Javascript, and parsed by Javascript !

It is an "immutable" pure functional reduction of the ECMAScript grammar: loosely based on descriptions from [here](https://gist.github.com/avdg/1f10e268e484b1284b46) and [here](http://tomcopeland.blogs.com/EcmaScript.html). Matches (almost) anything you can put on the right hand side of an assignment operator in ES2015.

The mutating constructs such as increment / decrement / assignment operators, as well as higher level language constructs (loops, classes etc) are excluded.
