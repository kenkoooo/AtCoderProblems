package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"net"
	"net/http"
	"net/http/fcgi"
	"os"
	"regexp"
	"strings"
	"sync"
	"time"

	as "./api_server"
	ct "./crawl_tools"
	"github.com/Sirupsen/logrus"
	_ "github.com/go-sql-driver/mysql"
)

func main() {
	mu := sync.RWMutex{}
	problem_cache := make(map[string][]as.Problem)
	contest_cache := make(map[string][]as.Contest)
	ranking_cache := make(map[string][]as.Ranking)
	user_cache := make(map[string]as.User)

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
		rivals := []string{}
		{
			_, ok := req.Form["rivals"]
			if ok {
				rrep := regexp.MustCompile(`^[0-9_a-zA-Z,\-]*$`)
				req.Form["rivals"][0] = strings.Replace(req.Form["rivals"][0], "%2C", ",", -1)
				if rrep.Match([]byte(req.Form["rivals"][0])) && req.Form["rivals"][0] != "" {
					r := req.Form["rivals"][0]
					rivals = strings.Split(r, ",")
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
			mu.Lock()
			defer mu.Unlock()
			key := "problems^" + user + "^"
			for _, v := range rivals {
				key = key + v + ","
			}
			problems, ok := problem_cache[key]
			if !ok {
				problems = as.GetProblemList(db, user, rivals, true)
				problem_cache[key] = problems
				time.AfterFunc(time.Minute*3, func() {
					mu.Lock()
					defer mu.Unlock()
					delete(problem_cache, key)
				})
			}
			b, _ := json.MarshalIndent(problems, "", "\t")
			res.Header().Set("Content-Type", "application/json")
			fmt.Fprint(res, string(b))
		} else if tool == "contests" {
			mu.Lock()
			defer mu.Unlock()
			key := "contests^" + user + "^"
			for _, v := range rivals {
				key = key + v + ","
			}
			contests, ok := contest_cache[key]
			if !ok {
				contests = as.GetContestResult(db, logger, user, rivals)
				contest_cache[key] = contests
				time.AfterFunc(time.Minute*3, func() {
					mu.Lock()
					defer mu.Unlock()
					delete(contest_cache, key)
				})
			}
			b, _ := json.MarshalIndent(contests, "", "\t")
			res.Header().Set("Content-Type", "application/json")
			fmt.Fprint(res, string(b))
		} else if tool == "ranking" {
			mu.Lock()
			defer mu.Unlock()
			key := "ranking^" + kind
			ranking, ok := ranking_cache[key]
			if !ok {
				ranking = as.GetRanking(db, kind)
				ranking_cache[key] = ranking
				time.AfterFunc(time.Minute*3, func() {
					mu.Lock()
					defer mu.Unlock()
					delete(ranking_cache, key)
				})
			}
			b, _ := json.MarshalIndent(ranking, "", "\t")
			res.Header().Set("Content-Type", "application/json")
			fmt.Fprint(res, string(b))
		} else if tool == "user" {
			mu.Lock()
			defer mu.Unlock()
			key := "user^" + user
			userStruct, ok := user_cache[key]
			if !ok {
				userStruct = as.GetUser(db, logger, user)
				user_cache[key] = userStruct
				time.AfterFunc(time.Minute*3, func() {
					mu.Lock()
					defer mu.Unlock()
					delete(user_cache, key)
				})
			}
			b, _ := json.MarshalIndent(userStruct, "", "\t")
			res.Header().Set("Content-Type", "application/json")
			fmt.Fprint(res, string(b))
		} else if tool == "submissions" {
			submissions := as.GetSubmissionList(db, logger, user, contest, problem, status)
			b, _ := json.MarshalIndent(submissions, "", "\t")
			res.Header().Set("Content-Type", "application/json")
			fmt.Fprint(res, string(b))
		} else if tool == "test" {
		}

		fmt.Println("Close!")
		f.Close()
	})
	fcgi.Serve(l, nil)
}
