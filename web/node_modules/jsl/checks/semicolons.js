module.exports = check_for_no_semicolons

check_for_no_semicolons.selector = 'block > *'

function check_for_no_semicolons(node, subsource, alert) {
  var src = node.src || node.source()
    , i = src.length - 1

  while(/\s/.test(src[i])) {
    --i
  }

  if(src[i] !== ';') {
    return
  }

  alert(
      node
    , 'semicolons are not allowed'
  )
}
