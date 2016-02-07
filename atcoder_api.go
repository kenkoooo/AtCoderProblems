package main

import (
	"database/sql"
	"encoding/json"
	"flag"
	"fmt"
	"net"
	"net/http"
	"net/http/fcgi"
	"os"
	"regexp"
	"strings"
	"time"

	as "./api_server"
	ct "./crawl_tools"
	sq "github.com/Masterminds/squirrel"
	"github.com/Sirupsen/logrus"
	_ "github.com/go-sql-driver/mysql"
)

type Problem struct {
	Id      string `json:"-"`
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

	Solvers int `json:"solvers"`

	Status string              `json:"status"`
	ACTime string              `json:"ac_time"`
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

type Contest struct {
	Id    string `json:"-"`
	Name  string `json:"name"`
	Start string `json:"start"`
	End   string `json:"end"`
}

// func GetContestResultList(db *sql.DB, logger *logrus.Logger, user, rivals string) {

// }

func GetProblemList(db *sql.DB, logger *logrus.Logger, user, rivals string) map[string]Problem {
	ret := make(map[string]Problem)
	{
		rows, _ := sq.Select(
			"p.id",
			"p.contest",
			"p.name",
			"p.shortest_submission_id",
			"p.fastest_submission_id",
			"p.first_submission_id",
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
				&x.ProblemId,
				&x.Status,
				&x.CreatedAt,
			)

			if ret[x.ProblemId].Status != "AC" {
				tmp := ret[x.ProblemId]
				tmp.Status = x.Status
				if x.Status == "AC" {
					tmp.ACTime = x.CreatedAt
				}
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

	logger.WithFields(logrus.Fields{
		"user":   user,
		"rivals": rivals,
	}).Info("API request")
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

	logger := logrus.New()
	logger.Formatter = new(logrus.JSONFormatter)
	if err := os.Mkdir("log", 0777); err != nil {
		fmt.Println(err)
	}

	http.HandleFunc("/", func(res http.ResponseWriter, req *http.Request) {
		db := ct.GetMySQL(*u, *p)
		defer db.Close()
		req.ParseForm()
		path := strings.Split(req.URL.Path, "/")
		tool := path[2]
		user := ""
		{
			_, ok := req.Form["user"]
			if ok {
				urep := regexp.MustCompile(`^[0-9_a-zA-Z\-]*$`)
				if urep.Match([]byte(req.Form["user"][0])) {
					user = req.Form["user"][0]
				}
			}
		}
		rivals := ""
		{
			_, ok := req.Form["rivals"]
			if ok {
				rrep := regexp.MustCompile(`^[0-9_a-zA-Z,\-]*$`)
				req.Form["rivals"][0] = strings.Replace(req.Form["rivals"][0], "%2C", ",", -1)
				if rrep.Match([]byte(req.Form["rivals"][0])) {
					rivals = req.Form["rivals"][0]
				}
			}
		}
		kind := ""
		{
			_, ok := req.Form["kind"]
			if ok {
				rrep := regexp.MustCompile(`^[a-z]*$`)
				if rrep.Match([]byte(req.Form["kind"][0])) {
					kind = req.Form["kind"][0]
				}
			}
		}
		status := ""
		{
			_, ok := req.Form["status"]
			if ok {
				rrep := regexp.MustCompile(`^[A-Z]*$`)
				if rrep.Match([]byte(req.Form["status"][0])) {
					status = req.Form["status"][0]
				}
			}
		}
		contest := ""
		{
			_, ok := req.Form["contest"]
			if ok {
				rrep := regexp.MustCompile(`^[a-z_0-9A-Z\-]*$`)
				if rrep.Match([]byte(req.Form["contest"][0])) {
					contest = req.Form["contest"][0]
				}
			}
		}
		problem := ""
		{
			_, ok := req.Form["problem"]
			if ok {
				rrep := regexp.MustCompile(`^[0-9_a-zA-Z\-]*$`)
				if rrep.Match([]byte(req.Form["problem"][0])) {
					problem = req.Form["problem"][0]
				}
			}
		}

		f, _ := os.OpenFile(
			"log/api-"+time.Now().Format("2006-01-02")+".log", os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
		logger.Out = f

		if tool == "problems" {
			problems := GetProblemList(db, logger, user, rivals)
			b, _ := json.MarshalIndent(problems, "", "\t")
			res.Header().Set("Content-Type", "application/json")
			fmt.Fprint(res, string(b))
		} else if tool == "contests" {
			contests := make(map[string]Contest)
			rows, _ := sq.Select("id", "name", "start", "end").From("contests").RunWith(db).Query()
			for rows.Next() {
				c := Contest{}
				rows.Scan(&c.Id, &c.Name, &c.Start, &c.End)
				contests[c.Id] = c
			}
			b, _ := json.MarshalIndent(contests, "", "\t")
			res.Header().Set("Content-Type", "application/json")
			fmt.Fprint(res, string(b))
		} else if tool == "ranking" {
			ranking := as.GetRanking(db, kind)
			b, _ := json.MarshalIndent(ranking, "", "\t")
			res.Header().Set("Content-Type", "application/json")
			fmt.Fprint(res, string(b))
		} else if tool == "user" {
			userStruct := as.GetUser(db, logger, user)
			b, _ := json.MarshalIndent(userStruct, "", "\t")
			res.Header().Set("Content-Type", "application/json")
			fmt.Fprint(res, string(b))
		} else if tool == "submissions" {
			submissions := as.GetSubmissionList(db, logger, user, contest, problem, status)
			b, _ := json.MarshalIndent(submissions, "", "\t")
			res.Header().Set("Content-Type", "application/json")
			fmt.Fprint(res, string(b))
		}

		fmt.Println("Close!")
		f.Close()
	})
	fcgi.Serve(l, nil)
}
