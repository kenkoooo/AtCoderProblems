package main

import (
	"encoding/json"
	"flag"
	"io/ioutil"
	"os"

	as "./api_server"
	ct "./crawl_tools"
	_ "github.com/go-sql-driver/mysql"
)

func main() {

	u := flag.String("u", "user", "user name to connect to MySQL server")
	p := flag.String("p", "password", "password to connect to MySQL server")
	j := flag.String("j", "jsonpath", "path to json")
	flag.Parse()

	db := ct.GetMySQL(*u, *p)
	defer db.Close()

	problems := as.GetProblemList(db, "", []string{}, true)
	content, _ := json.MarshalIndent(problems, "", "\t")
	ioutil.WriteFile(*j, content, os.ModePerm)
}
