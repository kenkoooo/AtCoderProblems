package sqlget

import (
	"fmt"
	"testing"
)

func TestGetProblemSet(t *testing.T) {
	problems, problem_names, _, _ := GetProblemSet("tdpc")
	for i := range problems {
		fmt.Println(problems[i] + " " + problem_names[i])
	}
}
