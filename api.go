package main

import (
	"database/sql"
	"encoding/json"
	"flag"
	"fmt"
	"net"
	"net/http"
	"net/http/fcgi"
	"regexp"
	"strings"

	sqlget "./sqlget"
	sq "github.com/Masterminds/squirrel"
	_ "github.com/go-sql-driver/mysql"
)

type Problem struct {
	Id       string `json:"-"`
	Contest  string `json:"contest"`
	Shortest string `json:"shortest"`
	Fastest  string `json:"fastest"`
	First    string `json:"first"`

	ShortestUser string
	FastestUser  string
	FirstUser    string

	Status string              `json:"status"`
	Rivals map[string]struct{} `json:"rivals"`
}

type Submission struct {
	Id           int
	ProblemId    string
	ContestId    string
	User         string
	Language     string
	SourceLength int
	Status       string
	ExecTime     int
	CreatedAt    string
}

func GetProblemList(db *sql.DB, user, rivals string) map[string]Problem {
	ret := make(map[string]Problem)
	{
		rows, _ := sq.Select(
			"p.id",
			"p.contest",
			"p.shortest_submission_id",
			"p.fastest_submission_id",
			"p.first_submission_id",
			"sh.user_name",
			"fs.user_name",
			"fa.user_name",
		).From("problems AS p").LeftJoin(
			"submissions AS sh ON sh.id=p.shortest_submission_id").LeftJoin(
			"submissions AS fs ON fs.id=p.fastest_submission_id").LeftJoin(
			"submissions AS fa ON fa.id=p.first_submission_id").RunWith(db).Query()
		for rows.Next() {
			x := Problem{}
			rows.Scan(
				&x.Id,
				&x.Contest,
				&x.Shortest,
				&x.Fastest,
				&x.First,
				&x.ShortestUser,
				&x.FastestUser,
				&x.FirstUser,
			)
			x.Rivals = make(map[string]struct{})
			x.Status = ""
			ret[x.Id] = x
		}
	}
	if user != "" {
		rows, _ := sq.Select("*").From("submissions").Where(sq.Eq{
			"user_name": user,
		}).RunWith(db).Query()
		for rows.Next() {
			x := Submission{}
			rows.Scan(
				&x.Id,
				&x.ProblemId,
				&x.ContestId,
				&x.User,
				&x.Status,
				&x.SourceLength,
				&x.Language,
				&x.ExecTime,
				&x.CreatedAt,
			)

			if ret[x.ProblemId].Status != "AC" {
				tmp := ret[x.ProblemId]
				tmp.Status = x.Status
				ret[x.ProblemId] = tmp
			}
		}
	}
	if rivals != "" {
		r := strings.Split(rivals, ",")
		rows, _ := sq.Select("*").From("submissions").Where(sq.And{
			sq.Eq{"user_name": r}, sq.Eq{"status": "AC"},
		}).RunWith(db).Query()
		for rows.Next() {
			x := Submission{}
			rows.Scan(
				&x.Id,
				&x.ProblemId,
				&x.ContestId,
				&x.User,
				&x.Status,
				&x.SourceLength,
				&x.Language,
				&x.ExecTime,
				&x.CreatedAt,
			)

			ret[x.ProblemId].Rivals[x.User] = struct{}{}
		}
	}

	return ret
}

func main() {
	u := flag.String("u", "user", "user name to connect to MySQL server")
	p := flag.String("p", "password", "password to connect to MySQL server")
	flag.Parse()

	l, err := net.Listen("tcp", ":55555")
	if err != nil {
		return
	}

	http.HandleFunc("/", func(res http.ResponseWriter, req *http.Request) {
		db := sqlget.GetMySQL(*u, *p)
		defer db.Close()
		req.ParseForm()
		path := strings.Split(req.URL.Path, "/")
		tool := path[2]
		user := ""
		{
			_, ok := req.Form["user"]
			if ok {
				urep := regexp.MustCompile(`^[0-9_a-zA-Z]*$`)
				if urep.Match([]byte(req.Form["user"][0])) {
					user = req.Form["user"][0]
				}
			}
		}
		rivals := ""
		{
			_, ok := req.Form["rivals"]
			if ok {
				rrep := regexp.MustCompile(`^[0-9_a-zA-Z,]*$`)
				if rrep.Match([]byte(req.Form["rivals"][0])) {
					rivals = req.Form["rivals"][0]
				}
			}
		}
		if tool == "problems" {
			problems := GetProblemList(db, user, rivals)
			b, _ := json.Marshal(problems)
			res.Header().Set("Content-Type", "application/json")
			fmt.Fprint(res, string(b))
		}
	})
	fcgi.Serve(l, nil)
}
