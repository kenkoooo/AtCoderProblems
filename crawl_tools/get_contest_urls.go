package sqlget

import (
	"regexp"

	"github.com/PuerkitoBio/goquery"
	_ "github.com/go-sql-driver/mysql"
)

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
