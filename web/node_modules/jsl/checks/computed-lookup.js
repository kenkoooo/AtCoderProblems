module.exports = computed_lookup

computed_lookup.selector = 'lookup > * + literal'

function computed_lookup(node, subsource, alert) {
  if(node.raw[0] !== '"' && node.raw[0] !== "'") {
    return
  }

  if(/\d/.test(node.raw[1])) {
    return
  }

  if(node.raw.slice(1, -1).replace(/[\d\w_]+/g, '').length) {
    return
  }

  alert(
      node
    , '%r should be written %r'
    , node.parent.source()
    , node.parent.object.src + '.' + node.src.slice(1, -1)
  )
}
