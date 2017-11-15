package com.kenkoooo.db

import scalikejdbc.ParameterBinder
import scalikejdbc.interpolation.SQLSyntax

trait ColumnMappingSupport[A] {
  def columnMapping(a: A): Seq[(SQLSyntax, ParameterBinder)]
}
