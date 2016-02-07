package sqlget

import (
	"database/sql"
	"fmt"
	"strconv"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/Sirupsen/logrus"
	_ "github.com/go-sql-driver/mysql"
)

func GetMySQL(user string, pass string) (db *sql.DB) {
	server := user + ":" + pass + "@/atcoder"
	db, err := sql.Open("mysql", server)
	if err != nil {
		panic(err.Error())
	}
	return db
}

func NewRecord(table, column, key string, db *sql.DB) bool {
	query, args, _ := sq.Select(column).From(table).Where(sq.Eq{column: key}).Limit(1).ToSql()
	row, _ := db.Query(query, args...)
	defer row.Close()
	for row.Next() {
		return false
	}
	return true
}

func UpdateProblemSet(db *sql.DB, logger *logrus.Logger) {
	urls := GetContestUrls()
	for _, contest := range urls {
		if !NewRecord("contests", "id", contest, db) {
			continue
		}

		problems, problem_names, times, contest_name := GetProblemSet(contest)
		if len(problems) == 0 {
			fmt.Println(problems)
			continue
		}
		logger.WithFields(logrus.Fields{
			"contest": contest,
			"name":    contest_name,
			"start":   times[0],
			"end":     times[1],
		}).Info("crawling problems")
		sq.Insert("contests").Columns(
			"id",
			"name",
			"start",
			"end",
		).Values(
			contest,
			contest_name,
			times[0],
			times[1],
		).RunWith(db).Exec()

		q := sq.Insert("problems").Columns("id", "contest", "name")
		for i, problem := range problems {
			if NewRecord("problems", "id", problem, db) {
				q = q.Values(problem, contest, problem_names[i])
			}
		}
		q.RunWith(db).Exec()
	}
}

func ExtraUpdateSubmissions(db *sql.DB, contest string) {
	fmt.Println(contest)
	M := 1
	for i := 1; i <= M; i++ {
		submissions, max := GetSubmissions(contest, i)
		if max > M {
			M = max
		}
		q := sq.Insert("submissions")
		q = q.Columns(
			"id", "problem_id", "contest_id",
			"user_name", "status", "source_length", "language",
			"exec_time", "created_time")
		for _, s := range submissions {
			if NewRecord("submissions", "id", s.IdStr(), db) {
				q = q.Values(
					s.Id, s.ProblemId, contest,
					s.User, s.Status, s.SourceLength, s.Language,
					s.ExecTime, s.CreatedAt)
			}
		}
		q.RunWith(db).Exec()
		fmt.Println(i)
	}
	sq.Update("contests").Set("last_crawled", time.Now().Format("2006-01-02 15:04:05")).Where(sq.Eq{"id": contest}).RunWith(db).Exec()

}

func MaintainDatabase(db *sql.DB, logger *logrus.Logger) {
	rows, _ := sq.Select("problem_id").From("submissions").Where(sq.And{
		sq.Expr("created_time > ?", time.Now().Add(-9*time.Hour-5*time.Minute).Format("2006-01-02 15:04:05")),
		sq.Eq{"status": "AC"},
	}).RunWith(db).Query()

	for rows.Next() {
		problem := ""
		rows.Scan(&problem)

		p := sq.Eq{"problem_id": problem}
		ac := sq.Eq{"status": "AC"}
		short := 0
		sq.Select("id").From("submissions").Where(sq.And{p, ac}).OrderBy("source_length", "id").RunWith(db).QueryRow().Scan(&short)

		fast := 0
		sq.Select("id").From("submissions").Where(sq.And{p, ac}).OrderBy("exec_time", "id").RunWith(db).QueryRow().Scan(&fast)

		first := 0
		sq.Select("id").From("submissions").Where(sq.And{p, ac}).OrderBy("id").RunWith(db).QueryRow().Scan(&first)

		sq.Update("problems").SetMap(sq.Eq{
			"shortest_submission_id": short,
			"fastest_submission_id":  fast,
			"first_submission_id":    first,
		}).Where(sq.Eq{"id": problem}).RunWith(db).Exec()
	}
}

func UpdateSubmissions(db *sql.DB, logger *logrus.Logger) {
	contest := ""
	{
		row, _ := sq.Select("id").From("contests").OrderBy("last_crawled").Limit(1).RunWith(db).Query()
		for row.Next() {
			row.Scan(&contest)
			fmt.Println(contest)
		}
	}

	M := 1
	for i := 1; i <= M; i++ {
		submissions, max := GetSubmissions(contest, i)
		logger.WithFields(logrus.Fields{"contest": contest, "page": strconv.Itoa(i)}).Info("crawling page")
		if len(submissions) == 0 {
			break
		}
		if max > M {
			M = max
		}
		q := sq.Insert("submissions")
		q = q.Columns(
			"id", "problem_id", "contest_id",
			"user_name", "status", "source_length", "language",
			"exec_time", "created_time")

		crawled_flag := false
		for _, s := range submissions {
			if NewRecord("submissions", "id", s.IdStr(), db) {
				q = q.Values(
					s.Id, s.ProblemId, contest,
					s.User, s.Status, s.SourceLength, s.Language,
					s.ExecTime, s.CreatedAt)
			} else {
				crawled_flag = true
			}
		}
		q.RunWith(db).Exec()
		fmt.Println(i)
		if crawled_flag {
			break
		}
	}
	sq.Update("contests").Set("last_crawled", time.Now().Format("2006-01-02 15:04:05")).Where(sq.Eq{"id": contest}).RunWith(db).Exec()
}
