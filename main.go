package main

import (
	"./crawler"
	"./sqlconnect"
	"fmt"
	sq "github.com/Masterminds/squirrel"
	_ "github.com/go-sql-driver/mysql"
)

func main() {
	var u string
	var p string
	fmt.Scan(&u)
	fmt.Scan(&p)
	db := sqlconnect.GetMySQL(u, p)
	defer db.Close()

	urls := crawler.GetContestUrls()
	for _, contest := range urls {
		if sqlconnect.NewRecord("contests", "id", contest, db) {
			problems := crawler.GetProblemSet(contest)
			if len(problems) == 0 {
				continue
			}
			query, args, _ := sq.Insert("contests").Columns("id").Values(contest).ToSql()
			db.Exec(query, args...)
			q := sq.Insert("problems").Columns("id", "contest")
			for _, problem := range problems {
				if sqlconnect.NewRecord("problems", "id", problem, db) {
					q = q.Values(problem, contest)
				}
			}
			query, args, _ = q.ToSql()
			db.Exec(query, args...)
		}
	}

	s := crawler.GetSubmissions("abc032")
	for _, submit := range s {

	}

}
