module.exports = nested_object

nested_object.selector = 'object > * > object'

function nested_object(node, subsource, alert) {
  if(node.properties.length > 1) {
    alert(
        node
      , 'nesting object literals inside of other ' +
        'object literals is discouraged.'
    )
  }
}

