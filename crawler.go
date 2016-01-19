package main

import (
	"flag"
	"fmt"
	"os"
	"time"

	sqlget "./sqlget"
	"github.com/Sirupsen/logrus"
	_ "github.com/go-sql-driver/mysql"
)

const cycle = 1800
const onesec_nano = 1000000000

func main() {
	u := flag.String("u", "user", "user name to connect to MySQL server")
	p := flag.String("p", "password", "password to connect to MySQL server")
	flag.Parse()

	db := sqlget.GetMySQL(*u, *p)
	defer db.Close()

	logger := logrus.New()
	logger.Formatter = new(logrus.JSONFormatter)
	if err := os.Mkdir("log", 0777); err != nil {
		fmt.Println(err)
	}

	for i := 0; ; i++ {
		i %= cycle

		f, _ := os.OpenFile("log/"+time.Now().Format("2006-01-02")+".log", os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
		logger.Out = f
		if i == 0 {
			sqlget.UpdateProblemSet(db, logger)
		} else {
			sqlget.UpdateSubmissions(db, logger)
		}

		sqlget.MaintainDatabase(db, logger)
		f.Close()

		time.Sleep(onesec_nano)
	}
}
