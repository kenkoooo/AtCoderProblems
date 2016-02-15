package api_server

import (
	"database/sql"

	sq "github.com/Masterminds/squirrel"
	"github.com/Sirupsen/logrus"
)

type Contest struct {
	Id         string         `json:"id"`
	Name       string         `json:"name"`
	Start      string         `json:"start"`
	End        string         `json:"end"`
	Rank       int            `json:"rank"`
	RivalRanks map[string]int `json:"rival_ranks"`
}

func GetContestResult(db *sql.DB, logger *logrus.Logger, user_name string, rivals []string) []Contest {
	contests := make(map[string]Contest)
	{
		rows, _ := sq.Select("id", "name", "start", "end").From("contests").RunWith(db).Query()
		for rows.Next() {
			c := Contest{}
			rows.Scan(&c.Id, &c.Name, &c.Start, &c.End)
			c.RivalRanks = make(map[string]int)
			contests[c.Id] = c
		}
	}

	if user_name != "" {
		rows, _ := sq.Select("contest", "rank").From("results").Where(sq.Eq{"user": user_name}).RunWith(db).Query()
		for rows.Next() {
			contest := ""
			rank := 0
			rows.Scan(&contest, &rank)
			tmp := contests[contest]
			tmp.Rank = rank
			contests[contest] = tmp
		}
	}

	if len(rivals) > 0 {
		rows, _ := sq.Select("contest", "user", "rank").From("results").Where(sq.Eq{"user": rivals}).RunWith(db).Query()
		for rows.Next() {
			contest := ""
			user := ""
			rank := 0
			rows.Scan(&contest, &user, &rank)
			tmp := contests[contest]
			tmp.RivalRanks[user] = rank
			contests[contest] = tmp
		}

	}

	ret := []Contest{}
	for _, v := range contests {
		ret = append(ret, v)
	}

	return ret
}
