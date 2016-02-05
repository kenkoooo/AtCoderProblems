package sqlget

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"

	"github.com/PuerkitoBio/goquery"
	_ "github.com/go-sql-driver/mysql"
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

func GetSubmissions(contest string, i int) ([]Submit, int) {
	max := 1

	url := "http://" + contest + ".contest.atcoder.jp/submissions/all/" + strconv.Itoa(i)
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
	urep := regexp.MustCompile(`^/users/([0-9_a-zA-Z\-]*)$`)
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
