module.exports = triple_equals

triple_equals.selector = 'binary[operator=\\=\\=],binary[operator="\\!\\="]'

function triple_equals(node, subsource, alert) {
  alert(node, 'use %r', node.operator + '=')
}
