package main

import (
	"database/sql"
	"fmt"
	sq "github.com/Masterminds/squirrel"
	"github.com/PuerkitoBio/goquery"
	_ "github.com/go-sql-driver/mysql"
	"regexp"
)

const atcoder = "http://atcoder.jp/"

func GetMySQL(user string, pass string) (db *sql.DB) {
	server := user + ":" + pass + "@/atcoder"
	db, err := sql.Open("mysql", server)
	if err != nil {
		panic(err.Error())
	}
	return db
}

func GetContestUrls() []string {
	x := []string{}
	doc, _ := goquery.NewDocument(atcoder)
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

func NewRecord(table, column, key string, db *sql.DB) bool {
	query, args, _ := sq.Select(column).From(table).Where(sq.Eq{column: key}).ToSql()
	row, _ := db.Query(query, args...)
	defer row.Close()
	for row.Next() {
		return false
	}
	return true
}

func GetSubmissions(contest string) {
	set := make(map[string]bool)
	url := "http://" + contest + ".contest.atcoder.jp/submissions/all"
	doc, _ := goquery.NewDocument(url)
	rep := regexp.MustCompile(`^/submissions/([0-9]*)$`)
	doc.Find("a").Each(func(_ int, s *goquery.Selection) {
		url, _ := s.Attr("href")
		if rep.Match([]byte(url)) {
			url = rep.ReplaceAllString(url, "$1")
			set[url] = true
		}
	})

	for key, _ := range set {
		fmt.Println(key)
	}

}

func main() {
	var u string
	var p string
	fmt.Scan(&u)
	fmt.Scan(&p)
	db := GetMySQL(u, p)
	defer db.Close()

	urls := GetContestUrls()
	for _, contest := range urls {
		if NewRecord("contests", "id", contest, db) {
			problems := GetProblemSet(contest)
			if len(problems) == 0 {
				continue
			}
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

	GetSubmissions("abc032")

}
