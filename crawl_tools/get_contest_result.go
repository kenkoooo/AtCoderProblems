package sqlget

import (
	"encoding/json"
	"regexp"
	"strings"

	"database/sql"
	"fmt"

	sq "github.com/Masterminds/squirrel"
	"github.com/PuerkitoBio/goquery"
)

type ContestUser struct {
	rank             int
	user_screen_name string
}

func GetContestResult(contest string) []ContestUser {
	js := GetContestResultJSON(contest)
	var d []map[string]interface{}
	json.Unmarshal([]byte(js), &d)

	users := []ContestUser{}
	for _, v := range d {
		user := ContestUser{}
		if str, ok := v["user_screen_name"].(string); ok {
			user.user_screen_name = str
		}
		if r, ok := v["rank"].(float64); ok {
			user.rank = int(r)
		}
		users = append(users, user)
	}
	return users
}

func GetContestResultJSON(contest string) string {
	doc, _ := goquery.NewDocument("http://" + contest + ".contest.atcoder.jp/standings")
	text := ""
	doc.Find("script").Each(func(_ int, s *goquery.Selection) {
		if strings.Contains(s.Text(), "ATCODER") {
			text = strings.Replace(s.Text(), "\n", " ", -1)
			return
		}
	})
	re := regexp.MustCompile("^.*data:(.*)};.*$")
	return re.ReplaceAllString(text, "$1")
}

func UpdateContestResult(db *sql.DB) {
	contests := GetContestUrls()
	for _, contest := range contests {
		if NewRecord("contests", "id", contest, db) {
			continue
		}
		if NewRecord("results", "contest", contest, db) {
			s := sq.Insert("results").Columns("contest", "user", "rank")
			users := GetContestResult(contest)
			if len(users) == 0 {
				continue
			}
			for _, user := range users {
				s = s.Values(contest, user.user_screen_name, user.rank)
			}
			_, err := s.RunWith(db).Exec()
			if err != nil {
				fmt.Println(err.Error())
			}
		}
	}
}
