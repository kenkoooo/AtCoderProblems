package main

import (
	"database/sql"
	"flag"
	"fmt"
	sq "github.com/Masterminds/squirrel"
	"github.com/PuerkitoBio/goquery"
	"github.com/Sirupsen/logrus"
	_ "github.com/go-sql-driver/mysql"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"
)

type Submit struct {
	Id           int
	ProblemId    string
	User         string
	Language     string
	SourceLength int
	Status       string
	ExecTime     int
	CreatedAt    string
}

func (s *Submit) IdStr() string {
	return strconv.Itoa(s.Id)
}

func GetContestUrls() []string {
	x := []string{}
	doc, _ := goquery.NewDocument("http://atcoder.jp/")
	rep := regexp.MustCompile(`^https*://([a-z0-9\-]*)\.contest\.atcoder.*$`)
	doc.Find("a").Each(func(_ int, s *goquery.Selection) {
		url, _ := s.Attr("href")
		if rep.Match([]byte(url)) {
			url = rep.ReplaceAllString(url, "$1")
			x = append(x, url)
		}
	})
	return x
}

func GetProblemSet(contest string) []string {
	set := make(map[string]bool)
	url := "http://" + contest + ".contest.atcoder.jp/assignments"
	doc, _ := goquery.NewDocument(url)
	rep := regexp.MustCompile(`^/tasks/([0-9_a-z]*)$`)
	doc.Find("a").Each(func(_ int, s *goquery.Selection) {
		url, _ := s.Attr("href")
		if rep.Match([]byte(url)) {
			url = rep.ReplaceAllString(url, "$1")
			set[url] = true
		}
	})

	x := []string{}
	for key, _ := range set {
		x = append(x, key)
	}
	return x
}

func GetSubmissions(contest string, i int) ([]Submit, int) {
	max := 1

	url := "http://" + contest + ".contest.atcoder.jp/submissions/all/" + strconv.Itoa(i)
	doc, _ := goquery.NewDocument(url)

	allrep := regexp.MustCompile(`^/submissions/all/([0-9]*)$`)
	doc.Find("a").Each(func(_ int, s *goquery.Selection) {
		url, _ := s.Attr("href")
		if allrep.Match([]byte(url)) {
			url = allrep.ReplaceAllString(url, "$1")
			page, _ := strconv.Atoi(url)
			if page > max {
				max = page
			}
		}
	})

	rep := regexp.MustCompile(`^/submissions/([0-9]*)$`)
	prep := regexp.MustCompile(`^/tasks/([0-9_a-z]*)$`)
	urep := regexp.MustCompile(`^/users/([0-9_a-zA-Z]*)$`)
	jrep := regexp.MustCompile(`^[0-9]*/[0-9]*$`)

	x := []Submit{}
	judging := false
	doc.Find("tbody").Each(func(_ int, s *goquery.Selection) {
		s.Find("tr").Each(func(_ int, s *goquery.Selection) {
			var key int
			var problem_id string
			var user_name string
			s.Find("a").Each(func(_ int, t *goquery.Selection) {
				url, _ := t.Attr("href")
				if rep.Match([]byte(url)) {
					url = rep.ReplaceAllString(url, "$1")
					key, _ = strconv.Atoi(url)
				} else if prep.Match([]byte(url)) {
					problem_id = prep.ReplaceAllString(url, "$1")
				} else if urep.Match([]byte(url)) {
					user_name = urep.ReplaceAllString(url, "$1")
				}
			})

			data := []string{}
			s.Find("td").Each(func(_ int, s *goquery.Selection) {
				data = append(data, s.Text())
			})

			length, _ := strconv.Atoi(strings.Replace(data[5], " Byte", "", -1))
			t := Submit{
				Id:           key,
				ProblemId:    problem_id,
				User:         user_name,
				Language:     data[3],
				SourceLength: length,
				Status:       data[6],
				CreatedAt:    data[0],
				ExecTime:     0,
			}
			if len(data) == 10 {
				exec_time, _ := strconv.Atoi(strings.Replace(data[7], " ms", "", -1))
				t.ExecTime = exec_time
			}
			if jrep.Match([]byte(t.Status)) || (t.Status == "WJ") {
				judging = true
			}
			x = append(x, t)
		})
	})
	if judging {
		y := []Submit{}
		return y, max

	}
	return x, max
}

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

		problems := GetProblemSet(contest)
		if len(problems) == 0 {
			continue
		}
		logger.WithFields(logrus.Fields{"contest": contest}).Info("crawling problems")
		query, args, _ := sq.Insert("contests").Columns("id").Values(contest).ToSql()
		db.Exec(query, args...)
		q := sq.Insert("problems").Columns("id", "contest")
		for _, problem := range problems {
			if NewRecord("problems", "id", problem, db) {
				q = q.Values(problem, contest)
			}
		}
		query, args, _ = q.ToSql()
		db.Exec(query, args...)
	}
}

func UpdateSubmissions(db *sql.DB, logger *logrus.Logger) {
	contest := ""
	{
		query, args, _ := sq.Select("id").From("contests").OrderBy("last_crawled").Limit(1).ToSql()
		row, _ := db.Query(query, args...)
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
		query, args, _ := q.ToSql()
		db.Exec(query, args...)
		fmt.Println(i)
		if crawled_flag {
			break
		}
	}

	query, args, _ := sq.Update("contests").Set("last_crawled", time.Now().Format("2006-01-02 15:04:05")).Where(sq.Eq{"id": contest}).ToSql()
	db.Exec(query, args...)
}

const cycle = 1800
const onesec_nano = 1000000000

func main() {
	u := flag.String("u", "user", "user name to connect to MySQL server")
	p := flag.String("p", "password", "password to connect to MySQL server")
	flag.Parse()

	db := GetMySQL(*u, *p)
	defer db.Close()

	logger := logrus.New()
	logger.Formatter = new(logrus.JSONFormatter)
	if err := os.Mkdir("log", 0777); err != nil {
		fmt.Println(err)
	}

	for i := 0; ; i++ {
		i %= cycle

		f, _ := os.OpenFile("log/"+time.Now().Format("2006-01-02")+".log", os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
		logger.Out = f
		if i == 0 {
			UpdateProblemSet(db, logger)
		} else {
			UpdateSubmissions(db, logger)
		}
		f.Close()

		time.Sleep(onesec_nano)
	}
}
