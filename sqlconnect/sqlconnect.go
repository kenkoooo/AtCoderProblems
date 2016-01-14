package sqlconnect

import (
	"database/sql"
	sq "github.com/Masterminds/squirrel"
	_ "github.com/go-sql-driver/mysql"
)

const atcoder = "http://atcoder.jp/"

func GetMySQL(user string, pass string) (db *sql.DB) {
	server := user + ":" + pass + "@/atcoder"
	db, err := sql.Open("mysql", server)
	if err != nil {
		panic(err.Error())
	}
	return db
}

func NewRecord(table, column, key string, db *sql.DB) bool {
	query, args, _ := sq.Select(column).From(table).Where(sq.Eq{column: key}).ToSql()
	row, _ := db.Query(query, args...)
	defer row.Close()
	for row.Next() {
		return false
	}
	return true
}
