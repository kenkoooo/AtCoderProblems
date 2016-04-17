package api_server

import (
	"database/sql"

	sq "github.com/Masterminds/squirrel"
	"github.com/Sirupsen/logrus"
)

type Problem struct {
	Id      string `json:"id"`
	Contest string `json:"contest"`
	Name    string `json:"name"`

	Shortest string `json:"-"`
	Fastest  string `json:"-"`
	First    string `json:"-"`

	ShortestContest string `json:"-"`
	FastestContest  string `json:"-"`
	FirstContest    string `json:"-"`

	ShortestURL string `json:"shortest_url"`
	FastestURL  string `json:"fastest_url"`
	FirstURL    string `json:"first_url"`

	ShortestUser string `json:"shortest_user"`
	FastestUser  string `json:"fastest_user"`
	FirstUser    string `json:"first_user"`

	SourceLength int `json:"source_length"`
	ExecTime     int `json:"exec_time"`

	Solvers    int `json:"solvers"`
	Difficulty int `json:"difficulty"`

	Status string              `json:"status"`
	ACTime string              `json:"ac_time"`
	Rivals map[string]struct{} `json:"rivals"`
}

func GetProblemList(db *sql.DB, logger *logrus.Logger, user string, rivals []string) []Problem {
	ret := make(map[string]Problem)
	{
		rows, _ := sq.Select(
			"p.id",
			"p.contest",
			"p.name",
			"p.shortest_submission_id",
			"p.fastest_submission_id",
			"p.first_submission_id",
			"p.difficulty",
			"sh.user_name",
			"fs.user_name",
			"fa.user_name",
			"sh.contest_id",
			"fs.contest_id",
			"fa.contest_id",
			"sh.source_length",
			"fs.exec_time",
		).From("problems AS p").LeftJoin(
			"submissions AS sh ON sh.id=p.shortest_submission_id").LeftJoin(
			"submissions AS fs ON fs.id=p.fastest_submission_id").LeftJoin(
			"submissions AS fa ON fa.id=p.first_submission_id").RunWith(db).Query()
		for rows.Next() {
			x := Problem{}
			rows.Scan(
				&x.Id,
				&x.Contest,
				&x.Name,
				&x.Shortest,
				&x.Fastest,
				&x.First,
				&x.Difficulty,
				&x.ShortestUser,
				&x.FastestUser,
				&x.FirstUser,
				&x.ShortestContest,
				&x.FastestContest,
				&x.FirstContest,
				&x.SourceLength,
				&x.ExecTime,
			)
			if x.SourceLength > 0 {

				x.ShortestURL = "http://" + x.ShortestContest + ".contest.atcoder.jp/submissions/" + x.Shortest
				x.FastestURL = "http://" + x.FastestContest + ".contest.atcoder.jp/submissions/" + x.Fastest
				x.FirstURL = "http://" + x.FirstContest + ".contest.atcoder.jp/submissions/" + x.First
			}
			x.Rivals = make(map[string]struct{})
			x.Status = ""
			ret[x.Id] = x
		}
	}
	{
		rows, _ := sq.Select("COUNT(DISTINCT(user_name))", "problem_id").From("submissions").Where(
			sq.Eq{"status": "AC"}).GroupBy("problem_id").RunWith(db).Query()
		for rows.Next() {
			s := ""
			solver := 0
			rows.Scan(&solver, &s)
			x, ok := ret[s]
			if ok {
				x.Solvers = solver
				ret[s] = x
			}
		}
	}
	if user != "" {
		rows, _ := sq.Select("problem_id", "status", "created_time").From("submissions").Where(sq.Eq{
			"user_name": user,
		}).RunWith(db).Query()
		for rows.Next() {
			x := Submission{}
			rows.Scan(
				&x.Problem,
				&x.Status,
				&x.Date,
			)

			if ret[x.Problem].Status != "AC" {
				tmp := ret[x.Problem]
				tmp.Status = x.Status
				if x.Status == "AC" {
					tmp.ACTime = x.Date
				}
				ret[x.Problem] = tmp
			}
		}
	}
	if len(rivals) > 0 {
		rows, _ := sq.Select("*").From("submissions").Where(sq.And{
			sq.Eq{"user_name": rivals}, sq.Eq{"status": "AC"},
		}).RunWith(db).Query()
		for rows.Next() {
			x := Submission{}
			rows.Scan(
				&x.Id,
				&x.Problem,
				&x.Contest,
				&x.User,
				&x.Status,
				&x.SourceLength,
				&x.Language,
				&x.ExecTime,
				&x.Date,
			)

			ret[x.Problem].Rivals[x.User] = struct{}{}
		}
	}

	ret_slice := []Problem{}
	for _, value := range ret {
		ret_slice = append(ret_slice, value)
	}
	logger.WithFields(logrus.Fields{
		"user":   user,
		"rivals": rivals,
	}).Info("API request")
	return ret_slice
}
