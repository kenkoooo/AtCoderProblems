package sqlget

import (
	"testing"

	"github.com/PuerkitoBio/goquery"
	"fmt"
)

func TestGetContestUrls(t *testing.T) {
	urls := GetContestUrls()
	for _, v := range urls {
		_, err := goquery.NewDocument("http://" + v + ".contest.atcoder.jp/")
		if err != nil {
			fmt.Println(err.Error())
		}
	}

}
