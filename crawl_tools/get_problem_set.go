package sqlget

import (
	"fmt"
	"regexp"

	"github.com/PuerkitoBio/goquery"
	_ "github.com/go-sql-driver/mysql"
)

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
			_, ok := set[url]
			if !ok {
				set[url] = s.Text()
			} else {
				set[url] += ". " + s.Text()
			}
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

	problems := []string{}
	problem_names := []string{}
	for key, name := range set {
		problems = append(problems, key)
		problem_names = append(problem_names, name)
	}
	return problems, problem_names, times, contest_name
}
