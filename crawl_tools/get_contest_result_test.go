package sqlget

import (
	"strconv"
	"testing"
)

func TestGetContestResultJSON(t *testing.T) {
	users := GetContestResult("abc032")
	for i, u := range users {
		if i+1 < u.rank {
			panic(strconv.Itoa((i + 1)) + " " + strconv.Itoa(u.rank))
		}
	}

}
