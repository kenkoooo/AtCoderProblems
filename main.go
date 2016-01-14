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

	contest := "abc032"
	submissions := crawler.GetSubmissions(contest)
	q := sq.Insert("submissions")
	q = q.Columns(
		"id", "problem_id", "contest_id",
		"user_name", "status", "source_length", "language",
		"exec_time", "created_time")
	for _, s := range submissions {
		if sqlconnect.NewRecord("submissions", "id", s.IdStr(), db) {
			q = q.Values(
				s.Id, s.ProblemId, contest,
				s.User, s.Status, s.SourceLength, s.Language,
				s.ExecTime, s.CreatedAt)
		}
	}
	query, args, _ := q.ToSql()
	db.Exec(query, args...)

}
