module.exports = no_eval

no_eval.selector = 'id[name=eval]'

function no_eval(node, subsource, alert) {
  alert(
      node
    , 'expected sanity, got `eval` instead (do not use eval)'
  )
}
