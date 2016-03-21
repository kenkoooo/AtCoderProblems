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

		problems, problemNames, times, contestName := GetProblemSet(contest)
		if len(problems) == 0 {
			fmt.Println(problems)
			continue
		}
		logger.WithFields(logrus.Fields{
			"contest": contest,
			"name":    contestName,
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
			contestName,
			times[0],
			times[1],
		).RunWith(db).Exec()

		q := sq.Insert("problems").Columns("id", "contest", "name")
		for i, problem := range problems {
			if NewRecord("problems", "id", problem, db) {
				q = q.Values(problem, contest, problemNames[i])
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
	changed_problems := []string{}
	{
		tmp := map[string]struct{}{}
		{
			rows, _ := sq.Select("problem_id").From("submissions").Where(sq.And{
				sq.Expr("created_time > ?", time.Now().Add(-9*time.Hour-5*time.Minute).Format("2006-01-02 15:04:05")),
				sq.Eq{"status": "AC"},
			}).RunWith(db).Query()
			for rows.Next() {
				s := ""
				rows.Scan(&s)
				tmp[s] = struct{}{}
			}
		}
		{
			rows, _ := sq.Select("id").From("problems").Where(
				sq.Eq{"first_submission_id": 0},
			).RunWith(db).Query()
			for rows.Next() {
				s := ""
				rows.Scan(&s)
				tmp[s] = struct{}{}
			}
		}
		for p := range tmp {
			changed_problems = append(changed_problems, p)
		}
	}
	if len(changed_problems) == 0 {
		return
	}
	fmt.Println(changed_problems)

	length_id := map[string]int{}
	length := map[string]int{}
	exec_id := map[string]int{}
	exec := map[string]int{}
	first_id := map[string]int{}
	{
		rows, _ := sq.Select("id").From("problems").Where(sq.Eq{"id": changed_problems}).RunWith(db).Query()
		for rows.Next() {
			p := ""
			rows.Scan(&p)
			length_id[p] = 0
			exec_id[p] = 0
			first_id[p] = 0
		}
	}
	{
		rows, _ := sq.Select("id", "problem_id", "source_length", "exec_time").From("submissions").Where(
			sq.And{
				sq.Eq{"status": "AC"},
				sq.Eq{"problem_id": changed_problems},
			},
		).RunWith(db).Query()
		for rows.Next() {
			id := 0
			problem_id := ""
			source_length := 0
			exec_time := 0
			rows.Scan(&id, &problem_id, &source_length, &exec_time)

			if first_id[problem_id] == 0 {
				first_id[problem_id] = id
			}
			if exec_id[problem_id] == 0 || exec[problem_id] > exec_time {
				exec_id[problem_id] = id
				exec[problem_id] = exec_time
			}
			if length_id[problem_id] == 0 || length[problem_id] > source_length {
				length_id[problem_id] = id
				length[problem_id] = source_length
			}
		}
	}

	for key, value := range first_id {
		sq.Update("problems").SetMap(sq.Eq{
			"shortest_submission_id": length_id[key],
			"fastest_submission_id":  exec_id[key],
			"first_submission_id":    value,
		}).Where(sq.Eq{"id": key}).RunWith(db).Exec()
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
		if max > M {
			M = max
		}
		if len(submissions) == 0 {
			break
		}
		q := sq.Insert("submissions")
		q = q.Columns(
			"id", "problem_id", "contest_id",
			"user_name", "status", "source_length", "language",
			"exec_time", "created_time")

		already_crawled := false
		for _, s := range submissions {
			if NewRecord("submissions", "id", s.IdStr(), db) {
				q = q.Values(
					s.Id, s.ProblemId, contest,
					s.User, s.Status, s.SourceLength, s.Language,
					s.ExecTime, s.CreatedAt)
			} else {
				already_crawled = true
			}
		}
		q.RunWith(db).Exec()
		if already_crawled {
			break
		}
	}
	sq.Update("contests").Set("last_crawled", time.Now().Format("2006-01-02 15:04:05")).Where(sq.Eq{"id": contest}).RunWith(db).Exec()

	t := 0
	sq.Select("COUNT(id)").From("submissions").Where(sq.Eq{"contest_id": contest}).RunWith(db).QueryRow().Scan(&t)
	if (M-1)*20 > t {
		ExtraUpdateSubmissions(db, contest)
	}
}
