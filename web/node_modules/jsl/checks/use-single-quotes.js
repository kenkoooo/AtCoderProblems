module.exports = singlequotes

singlequotes.selector = 'literal'

function singlequotes(node, subsource, alert) {
  var raw = node.raw

  if(!/['"]/.test(raw[0])) {
    return
  }

  if(node.value.indexOf("'") === -1 && node.raw[0] === '"') {
    alert(
        node
      , 'only use double quotes when wrapping a single quoted string'
    )
  }
}
