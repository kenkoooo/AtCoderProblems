package main

import (
	"fmt"
	"net"
	"net/http"
	"net/http/fcgi"
)

func handler(res http.ResponseWriter, req *http.Request) {
	req.ParseForm()
	fmt.Fprint(res, req.Form)
}

func main() {
	l, err := net.Listen("tcp", ":55555")
	if err != nil {
		return
	}
	http.HandleFunc("/", handler)
	fcgi.Serve(l, nil)
}
