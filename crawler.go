package main

import (
	"flag"
	"fmt"
	"os"
	"time"

	ct "./crawl_tools"
	"github.com/Sirupsen/logrus"
	_ "github.com/go-sql-driver/mysql"
)

const cycle = 1800

func main() {
	u := flag.String("u", "user", "user name to connect to MySQL server")
	p := flag.String("p", "password", "password to connect to MySQL server")
	flag.Parse()

	db := ct.GetMySQL(*u, *p)
	defer db.Close()

	logger := logrus.New()
	logger.Formatter = new(logrus.JSONFormatter)
	if err := os.Mkdir("log", 0777); err != nil {
		fmt.Println(err)
	}
	{
		f, _ := os.OpenFile("log/"+time.Now().Format("2006-01-02")+".log", os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
		logger.Out = f
		logger.Info("Crawler Start")
		f.Close()
	}

	for i := 0; ; i++ {
		i %= cycle

		f, _ := os.OpenFile("log/"+time.Now().Format("2006-01-02")+".log", os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
		logger.Out = f
		if i == 0 {
			ct.UpdateProblemSet(db, logger)
			ct.UpdateContestResult(db, logger)
		} else {
			ct.UpdateSubmissions(db, logger)
		}

		ct.MaintainDatabase(db, logger)
		f.Close()

		time.Sleep(1000000000)
	}
}
