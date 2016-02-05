package api_server

import (
	"database/sql"

	sq "github.com/Masterminds/squirrel"
)

type Ranking struct {
	Rank  int    `json:"rank"`
	User  string `json:"user"`
	Count int    `json:"count"`
}

func GetRanking(db *sql.DB, kind string) []Ranking {
	ret := []Ranking{}
	s := sq.Select()
	if kind == "short" {
		s = s.Column("COUNT(submissions.id) AS c").Column("user_name").From("problems").LeftJoin(
			"submissions ON submissions.id=problems.shortest_submission_id")
	} else if kind == "fast" {
		s = s.Column("COUNT(submissions.id) AS c").Column("user_name").From("problems").LeftJoin(
			"submissions ON submissions.id=problems.fastest_submission_id")
	} else if kind == "fa" {
		s = s.Column("COUNT(submissions.id) AS c").Column("user_name").From("problems").LeftJoin(
			"submissions ON submissions.id=problems.first_submission_id")
	} else {
		s = s.Column("COUNT(DISTINCT(problem_id)) AS c").Column("user_name").From("submissions").Where(
			sq.Eq{"status": "AC"})
	}

	rows, _ := s.GroupBy("user_name").OrderBy("c DESC").RunWith(db).Query()
	now := 0
	for rows.Next() {
		r := Ranking{Rank: 0, User: "", Count: 0}
		rows.Scan(&r.Count, &r.User)
		if len(ret) == 0 || r.Count != ret[now-1].Count {
			now = len(ret) + 1
		}
		r.Rank = now
		ret = append(ret, r)
	}
	return ret
}
