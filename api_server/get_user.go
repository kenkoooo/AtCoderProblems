package api_server

import (
	"database/sql"
	"regexp"

	sq "github.com/Masterminds/squirrel"
	"github.com/Sirupsen/logrus"
	_ "github.com/go-sql-driver/mysql"
)

type User struct {
	Name      string `json:"user"`
	ACRank    int    `json:"ac_rank"`
	ShortRank int    `json:"short_rank"`
	FastRank  int    `json:"fast_rank"`
	FirstRank int    `json:"first_rank"`
	ACNum     int    `json:"ac_num"`
	ShortNum  int    `json:"short_num"`
	FastNum   int    `json:"fast_num"`
	FirstNum  int    `json:"first_num"`

	AbcA int `json:"abc_a"`
	AbcB int `json:"abc_b"`
	AbcC int `json:"abc_c"`
	AbcD int `json:"abc_d"`
	ArcA int `json:"arc_a"`
	ArcB int `json:"arc_b"`
	ArcC int `json:"arc_c"`
	ArcD int `json:"arc_d"`

	AbcNum int `json:"abc_num"`
	ArcNum int `json:"arc_num"`
}

func GetUser(db *sql.DB, logger *logrus.Logger, user_name string) User {
	user := User{}
	if user_name == "" {
		return user
	}

	ac := GetRanking(db, "")
	for _, r := range ac {
		if r.User == user_name {
			user.ACRank = r.Rank
			user.ACNum = r.Count
			break
		}
	}
	if user.ACNum == 0 {
		return user
	}
	user.Name = user_name
	short := GetRanking(db, "short")
	for _, r := range short {
		if r.User == user_name {
			user.ShortRank = r.Rank
			user.ShortNum = r.Count
			break
		}
	}
	fast := GetRanking(db, "fast")
	for _, r := range fast {
		if r.User == user_name {
			user.FastRank = r.Rank
			user.FastNum = r.Count
			break
		}
	}
	fa := GetRanking(db, "fa")
	for _, r := range fa {
		if r.User == user_name {
			user.FirstRank = r.Rank
			user.FirstNum = r.Count
			break
		}
	}

	arc := regexp.MustCompile(`^arc[0-9]{3}_[0-9a-d]*$`)
	abc := regexp.MustCompile(`^abc[0-9]{3}_[0-9a-d]*$`)
	pa := regexp.MustCompile(`^a[rb]c[0-9]{3}_[a1]$`)
	pb := regexp.MustCompile(`^a[rb]c[0-9]{3}_[b2]$`)
	pc := regexp.MustCompile(`^a[rb]c[0-9]{3}_[c3]$`)
	rows, _ := sq.Select("DISTINCT(problem_id)").From("submissions").Where(sq.And{
		sq.Eq{"user_name": user_name},
		sq.Eq{"status": "AC"},
	}).GroupBy("problem_id").RunWith(db).Query()
	for rows.Next() {
		p_id := ""
		rows.Scan(&p_id)
		if arc.MatchString(p_id) {
			if pa.MatchString(p_id) {
				user.ArcA++
			} else if pb.MatchString(p_id) {
				user.ArcB++
			} else if pc.MatchString(p_id) {
				user.ArcC++
			} else {
				user.ArcD++
			}
		} else if abc.MatchString(p_id) {
			if pa.MatchString(p_id) {
				user.AbcA++
			} else if pb.MatchString(p_id) {
				user.AbcB++
			} else if pc.MatchString(p_id) {
				user.AbcC++
			} else {
				user.AbcD++
			}
		}
	}

	sq.Select("COUNT(id)").From("contests").Where("id LIKE 'arc%'").RunWith(db).QueryRow().Scan(&user.ArcNum)
	sq.Select("COUNT(id)").From("contests").Where("id LIKE 'abc%'").RunWith(db).QueryRow().Scan(&user.AbcNum)

	logger.WithFields(logrus.Fields{
		"user": user_name,
	}).Info("API request")
	return user
}
