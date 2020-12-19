## keppel

To test the parser generator I am using a toy grammar here describing a wannabe template engine compiling to HTML called Keppel.

The Keppel grammar is quite closely following [Jade](http://jade-lang.com/) except for the fact it does not rely on white space to generate the markup. For instance:

```
body [
  div.navbar.navbar-inverse.navbar-fixed-top [
    div.navbar-inner [
      a(href="#").brand ['Awesome']
      ul.nav [
        li[ a(href="#") ['Item 1'] ]
        li[ a(href="#") ['Item 2'] ]
      ]
    ]
  ]
]
```

compiles to

```html
<body>
  <div class="navbar navbar-inverse navbar-fixed-top">
    <div class="navbar-inner">
      <a href="#" class="brand">Awesome</a>
      <ul class="nav">
        <li><a href="#">Item 1</a></li>
        <li><a href="#">Item 2</a></li>
      </ul>
    </div>
  </div>
</body>
```
