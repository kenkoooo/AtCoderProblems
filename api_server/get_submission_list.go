package api_server

import (
	"database/sql"

	sq "github.com/Masterminds/squirrel"
	"github.com/Sirupsen/logrus"
)

type Submission struct {
	Id           int    `json:"id"`
	Problem      string `json:"problem"`
	Contest      string `json:"contest"`
	User         string `json:"user"`
	Status       string `json:"status"`
	SourceLength int    `json:"source_length"`
	Language     string `json:"lang"`
	ExecTime     int    `json:"exec_time"`
	Date         string `json:"date"`
}

func GetSubmissionList(db *sql.DB, logger *logrus.Logger, user_name string, contest string, problem string, status string) []Submission {
	query := sq.Select("id", "problem_id", "contest_id", "user_name", "status", "source_length", "language", "exec_time", "created_time").From("submissions")
	if user_name != "" {
		query = query.Where(sq.Eq{"user_name": user_name})
	}
	if contest != "" {
		query = query.Where(sq.Eq{"contest_id": contest})
	}
	if problem != "" {
		query = query.Where(sq.Eq{"problem_id": problem})
	}
	if status != "" {
		query = query.Where(sq.Eq{"status": status})
	}

	rows, _ := query.Limit(1000).RunWith(db).Query()
	ret := []Submission{}
	for rows.Next() {
		x := Submission{}
		rows.Scan(&x.Id, &x.Problem, &x.Contest, &x.User, &x.Status, &x.SourceLength, &x.Language, &x.ExecTime, &x.Date)
		ret = append(ret, x)
	}
	return ret
}
