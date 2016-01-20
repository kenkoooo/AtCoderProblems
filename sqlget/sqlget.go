package sqlget

import (
	"database/sql"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/PuerkitoBio/goquery"
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

func GetProblemSet(contest string) ([]string, []string, []string, string) {
	fmt.Println(contest)
	set := make(map[string]string)
	url := "http://" + contest + ".contest.atcoder.jp/assignments"
	doc, _ := goquery.NewDocument(url)
	rep := regexp.MustCompile(`^/tasks/([0-9_a-zA-Z]*)$`)
	doc.Find("a").Each(func(_ int, s *goquery.Selection) {
		url, _ := s.Attr("href")
		if rep.Match([]byte(url)) {
			url = rep.ReplaceAllString(url, "$1")
			set[url] = s.Text()
		}
	})

	times := []string{}
	doc.Find("span").Each(func(_ int, s *goquery.Selection) {
		s.Find("time").Each(func(_ int, t *goquery.Selection) {
			times = append(times, t.Text())
		})
	})

	contest_name := ""
	doc.Find(".contest-name").Each(func(_ int, s *goquery.Selection) {
		contest_name = s.Text()
	})
	fmt.Println(contest_name)

	x := []string{}
	problem_names := []string{}
	for key, name := range set {
		x = append(x, key)
		problem_names = append(problem_names, name)
	}
	return x, problem_names, times, contest_name
}

func GetSubmissions(contest string, i int, ac bool) ([]Submit, int) {
	max := 1
	suffix := ""
	if ac {
		suffix = "?status=AC"
	}

	url := "http://" + contest + ".contest.atcoder.jp/submissions/all/" + strconv.Itoa(i) + suffix
	fmt.Println(url)
	doc, _ := goquery.NewDocument(url)

	allrep := regexp.MustCompile(`^/submissions/all/([0-9]*).*$`)
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
	prep := regexp.MustCompile(`^/tasks/([0-9_a-zA-Z]*)$`)
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
		sq.Insert("contests").Columns("id", "name", "start", "end").Values(contest, contest_name, times[0], times[1]).RunWith(db).Exec()

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
		submissions, max := GetSubmissions(contest, i, true)
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

		sq.Update("problems").SetMap(sq.Eq{"shortest_submission_id": short, "fastest_submission_id": fast, "first_submission_id": first}).Where(sq.Eq{"id": problem}).RunWith(db).Exec()
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
		submissions, max := GetSubmissions(contest, i, false)
		logger.WithFields(logrus.Fields{"contest": contest, "page": strconv.Itoa(i)}).Info("crawling page")
		if max >= 500 && i == 1 {
			logger.WithFields(logrus.Fields{"contest": contest, "max": strconv.Itoa(max)}).Info("max exceeded")
		}
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
