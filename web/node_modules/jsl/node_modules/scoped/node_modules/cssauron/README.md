# cssauron

build a matching function in CSS for any nested object structure!

```javascript
var language = require('cssauron')({
    tag: 'tagName'
  , contents: 'innerText'
  , id: 'id'
  , class: 'className'
  , parent: 'parentNode'
  , children: 'childNodes'
  , attr: 'getAttribute(attr)'
})

var selector = language('body > #header .logo')
  , element = document.getElementsByClassName('logo')[0]

if(selector(element)) {
  // element matches selector
} else {
  // element does not match selector
}
```

# API

### require('cssauron')(options) -> selector factory

Import `cssauron` and configure it for the nested object structure you'll
want to match against.

#### options

`options` are an object hash of lookup type to string attribute or `function(node)` lookups for queried
nodes. You only need to provide the configuration necessary for the selectors you're planning on creating.
(If you're not going to use `#id` lookups, there's no need to provide the `id` lookup in your options.)

* `tag`: Extract tag information from a node for `div` style selectors.
* `contents`: Extract text information from a node, for `:contains(xxx)` selectors.
* `id`: Extract id for `#my_sweet_id` selectors.
* `class`: `.class_name`
* `parent`: Used to traverse up from the current node, for composite selectors `body #wrapper`, `body > #wrapper`.
* `children`: Used to traverse from a parent to its children for sibling selectors `div + span`, `a ~ p`.
* `attr`: Used to extract attribute information, for `[attr=thing]` style selectors.

### selector_factory('some selector') -> match function

Compiles a matching function.

### match(node) -> true or false

Returns true or false depending on whether the provided node matches the selector.

## Supported pseudoclasses 

`:first-child`
`:last-child`
`:empty`
`:root`
`:contains(text)`
`:any(selector, selector, selector)`

## Supported attribute lookups

`[attr=value]`: Exact match
`[attr]`: Attribute exists and is not false-y.
`[attr$=value]`: Attribute ends with value
`[attr^=value]`: Attribute starts with value
`[attr*=value]`: Attribute contains value
`[attr~=value]`: Attribute, split by whitespace, contains value.
`[attr|=value]`: Attribute, split by `-`, contains value.


