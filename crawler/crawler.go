package crawler

import (
	"github.com/PuerkitoBio/goquery"
	"regexp"
	"strconv"
	"strings"
)

const atcoder = "http://atcoder.jp/"

type Submit struct {
	id            int
	problem_id    string
	user          string
	language      string
	source_length int
	status        string
	exec_time     int
	created_at    string
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

func GetSubmissions(contest string) []Submit {
	url := "http://" + contest + ".contest.atcoder.jp/submissions/all"
	doc, _ := goquery.NewDocument(url)
	rep := regexp.MustCompile(`^/submissions/([0-9]*)$`)
	prep := regexp.MustCompile(`^/tasks/([0-9_a-z]*)$`)

	x := []Submit{}
	doc.Find("tbody").Each(func(_ int, s *goquery.Selection) {
		s.Find("tr").Each(func(_ int, s *goquery.Selection) {
			var key int
			var problem_id string
			s.Find("a").Each(func(_ int, t *goquery.Selection) {
				url, _ := t.Attr("href")
				if rep.Match([]byte(url)) {
					url = rep.ReplaceAllString(url, "$1")
					key, _ = strconv.Atoi(url)
				} else if prep.Match([]byte(url)) {
					problem_id = rep.ReplaceAllString(url, "$1")
				}
			})

			data := []string{}
			s.Find("td").Each(func(_ int, s *goquery.Selection) {
				data = append(data, s.Text())
			})
			length, _ := strconv.Atoi(strings.Replace(data[5], " Byte", "", -1))
			t := Submit{
				id:            key,
				problem_id:    problem_id,
				user:          data[2],
				language:      data[3],
				source_length: length,
				status:        data[6],
				created_at:    data[0],
				exec_time:     0,
			}
			if len(data) == 10 {
				exec_time, _ := strconv.Atoi(strings.Replace(data[7], " ms", "", -1))
				t.exec_time = exec_time
			}
			x = append(x, t)
		})
	})
	return x
}
