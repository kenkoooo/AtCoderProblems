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

	sqlget "./sqlget"
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

type Ranking struct {
	Rank  int    `json:"rank"`
	User  string `json:"user"`
	Count int    `json:"count"`
}

type User struct {
	Name      string `json:"user"`
	ACRank    int    `json:"ac_rank"`
	ShortRank int    `json:"short_rank"`
	FastRank  int    `json:"fast_rank"`
	FirstRank int    `json:"first_rank"`
	ACNum     int    `json:"ac_num"`
	ShortNum  int    `json:"short_num"`
	FastNum   int    `json:"fast_num"`
	FirstNum  int    `json:"first_num"`

	AbcA int `json:"abc_a"`
	AbcB int `json:"abc_b"`
	AbcC int `json:"abc_c"`
	AbcD int `json:"abc_d"`
	ArcA int `json:"arc_a"`
	ArcB int `json:"arc_b"`
	ArcC int `json:"arc_c"`
	ArcD int `json:"arc_d"`

	AbcNum int `json:"abc_num"`
	ArcNum int `json:"arc_num"`
}

func GetUser(db *sql.DB, logger *logrus.Logger, user_name string) User {
	user := User{}
	if user_name == "" {
		return user
	}

	ac := GetRanking(db, "")
	for _, r := range ac {
		if r.User == user_name {
			user.ACRank = r.Rank
			user.ACNum = r.Count
			break
		}
	}
	if user.ACNum == 0 {
		return user
	}
	user.Name = user_name
	short := GetRanking(db, "short")
	for _, r := range short {
		if r.User == user_name {
			user.ShortRank = r.Rank
			user.ShortNum = r.Count
			break
		}
	}
	fast := GetRanking(db, "fast")
	for _, r := range fast {
		if r.User == user_name {
			user.FastRank = r.Rank
			user.FastNum = r.Count
			break
		}
	}
	fa := GetRanking(db, "fa")
	for _, r := range fa {
		if r.User == user_name {
			user.FirstRank = r.Rank
			user.FirstNum = r.Count
			break
		}
	}

	arc := regexp.MustCompile(`^arc[0-9]{3}_[0-9a-d]*$`)
	abc := regexp.MustCompile(`^abc[0-9]{3}_[0-9a-d]*$`)
	pa := regexp.MustCompile(`^a[rb]c[0-9]{3}_[a1]$`)
	pb := regexp.MustCompile(`^a[rb]c[0-9]{3}_[b2]$`)
	pc := regexp.MustCompile(`^a[rb]c[0-9]{3}_[c3]$`)
	rows, _ := sq.Select("DISTINCT(problem_id)").From("submissions").Where(sq.And{
		sq.Eq{"user_name": user_name},
		sq.Eq{"status": "AC"},
	}).GroupBy("problem_id").RunWith(db).Query()
	for rows.Next() {
		p_id := ""
		rows.Scan(&p_id)
		if arc.MatchString(p_id) {
			if pa.MatchString(p_id) {
				user.ArcA++
			} else if pb.MatchString(p_id) {
				user.ArcB++
			} else if pc.MatchString(p_id) {
				user.ArcC++
			} else {
				user.ArcD++
			}
		} else if abc.MatchString(p_id) {
			if pa.MatchString(p_id) {
				user.AbcA++
			} else if pb.MatchString(p_id) {
				user.AbcB++
			} else if pc.MatchString(p_id) {
				user.AbcC++
			} else {
				user.AbcD++
			}
		}
	}

	sq.Select("COUNT(id)").From("contests").Where("id LIKE 'arc%'").RunWith(db).QueryRow().Scan(&user.ArcNum)
	sq.Select("COUNT(id)").From("contests").Where("id LIKE 'abc%'").RunWith(db).QueryRow().Scan(&user.AbcNum)

	logger.WithFields(logrus.Fields{
		"user": user_name,
	}).Info("API request")
	return user
}

func GetRanking(db *sql.DB, kind string) []Ranking {
	ret := []Ranking{}
	s := sq.Select()
	if kind == "short" {
		s = s.Column("COUNT(submissions.id) AS c").Column("user_name").From("problems").LeftJoin("submissions ON submissions.id=problems.shortest_submission_id")
	} else if kind == "fast" {
		s = s.Column("COUNT(submissions.id) AS c").Column("user_name").From("problems").LeftJoin("submissions ON submissions.id=problems.fastest_submission_id")
	} else if kind == "fa" {
		s = s.Column("COUNT(submissions.id) AS c").Column("user_name").From("problems").LeftJoin("submissions ON submissions.id=problems.first_submission_id")
	} else {
		s = s.Column("COUNT(DISTINCT(problem_id)) AS c").Column("user_name").From("submissions").Where(sq.Eq{"status": "AC"})
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
		rows, _ := sq.Select("COUNT(DISTINCT(user_name))", "problem_id").From("submissions").Where(sq.Eq{"status": "AC"}).GroupBy("problem_id").RunWith(db).Query()
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
		db := sqlget.GetMySQL(*u, *p)
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

		f, _ := os.OpenFile("log/api-"+time.Now().Format("2006-01-02")+".log", os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
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
			ranking := GetRanking(db, kind)
			b, _ := json.MarshalIndent(ranking, "", "\t")
			res.Header().Set("Content-Type", "application/json")
			fmt.Fprint(res, string(b))
		} else if tool == "user" {
			userStruct := GetUser(db, logger, user)
			b, _ := json.MarshalIndent(userStruct, "", "\t")
			res.Header().Set("Content-Type", "application/json")
			fmt.Fprint(res, string(b))
		}
		fmt.Println("Close!")
		f.Close()
	})
	fcgi.Serve(l, nil)
}
