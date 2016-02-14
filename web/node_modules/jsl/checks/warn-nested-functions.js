module.exports = nested_function

nested_function.selector = 'object > * > function'

function nested_function(node, subsource, alert) {
  alert(
      node
    , 'nesting function expressions inside of object literals is discouraged.'
  )
}

