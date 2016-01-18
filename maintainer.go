package main

import (
	"flag"
	"fmt"

	sqlget "./sqlget"
	sq "github.com/Masterminds/squirrel"
	_ "github.com/go-sql-driver/mysql"
)

const submissions = "submissions"

func main() {
	u := flag.String("u", "user", "user name to connect to MySQL server")
	p := flag.String("p", "password", "password to connect to MySQL server")
	flag.Parse()

	db := sqlget.GetMySQL(*u, *p)
	defer db.Close()

	ac := sq.Eq{"status": "AC"}
	rows, _ := sq.Select("id").From("problems").RunWith(db).Query()
	for rows.Next() {
		problem := ""
		rows.Scan(&problem)
		fmt.Println(problem)

		pid := sq.Eq{"problem_id": problem}
		first := 0
		sq.Select("id").From(submissions).Where(sq.And{ac, pid}).RunWith(db).QueryRow().Scan(&first)

		fastest := 0
		sq.Select("id").From(submissions).Where(sq.And{ac, pid}).OrderBy("exec_time", "id").RunWith(db).QueryRow().Scan(&fastest)

		shortest := 0
		sq.Select("id").From(submissions).Where(sq.And{ac, pid}).OrderBy("source_length", "id").RunWith(db).QueryRow().Scan(&shortest)

		sq.Update("problems").Where(sq.Eq{"id": problem}).Set(
			"shortest_submission_id", shortest).Set(
			"fastest_submission_id", fastest).Set(
			"first_submission_id", first).RunWith(db).Exec()
	}

}
