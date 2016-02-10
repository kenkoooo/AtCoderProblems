$(document).ready(function() {
    var params = getParam();
    if (params['kind'] !== "list") $("#problem-list").remove();
    if (params['kind'] !== "index") $("#problem-category").remove();
    if (params['kind'] !== "battle") $("#battle-list").remove();
    if (params['kind'] !== "ranking") {
        $("#ranking").remove();
    }
    if (params['kind'] !== "user") {
        $("#user-container").remove();
    }

    var user = params['name'];
    var rivals = params['rivals'].replace(/\%2C/g, ",");
    $("#user_name_text").val(user);
    $("#rival_text").val(rivals);

    //Category Mode
    if (params['kind'] === 'index') {
        showCategory(user, rivals);
    } else if (params['kind'] === 'list') {
        showList(user, rivals);
    } else if (params['kind'] === 'battle') {
        showBattle(user, rivals);
    } else if (params['kind'] === 'ranking') {
        // Ranking Mode
        showRanking(params);
    } else if (params['kind'] === 'user') {
        showUserPage(user)
    }

    var user_href = $("#user-page-link").attr("href");
    $("#user-page-link").attr("href", user_href + '&name=' + params["name"]);
    var header_href = $("#header-link").attr("href");
    $("#header-link").attr("href", header_href + '&name=' + params["name"]);
});

function showCategory(user, rivals) {
    $('input[name=list]').val(['0']);
    $.when($.getJSON("../atcoder-api/contests"),
        $.getJSON("../atcoder-api/problems", {
            "user": user,
            "rivals": rivals,
        })).done(function(data_c, data_p) {
        var contests_json = data_c[0];
        var problems_json = data_p[0];

        problems_json.sort(function(a, b) {
            if (a.name < b.name) return -1;
            if (a.name > b.name) return 1;
            return 0;
        });

        var contestArray = {};
        for (contest in contests_json) {
            var link = "<td><a href='http://" + contest + ".contest.atcoder.jp/' target='_blank'>" +
                contest + "</a></td>";

            if (contest.match(/^a[br]c[0-9]*$/)) {
                contestArray[contest] = link
            } else {
                link = "<strong><a target='_blank' href='http://" + contest + ".contest.atcoder.jp/'>" +
                    contests_json[contest]["name"] + "</a></strong><table class='table table-bordered'><tbody><tr>";
                contestArray[contest] = link;
            }
        }

        for (var i = 0; i < problems_json.length; i++) {
            var problem = problems_json[i]["id"];
            var contest = problems_json[i]["contest"];
            contestArray[contest] += "<td ";
            if (problems_json[i]["status"] === 'AC') {
                contestArray[contest] += "class='success'"
            } else if (Object.keys(problems_json[i]["rivals"]).length > 0) {
                contestArray[contest] += "class='danger'"
            } else if (problems_json[i]["status"] !== '') {
                contestArray[contest] += "class='warning'"
            }
            contestArray[contest] += "><a href='http://" + contest + ".contest.atcoder.jp/tasks/" +
                problem + "' target='_blank'>" + problems_json[i]["name"] + "</a></td>";
        }

        var sortedKeys = [];
        for (key in contestArray) {
            if (contestArray.hasOwnProperty(key)) {
                sortedKeys.push(key);
            }
        }

        sortedKeys.sort();

        for (var i = sortedKeys.length - 1; i >= 0; i--) {
            contest = sortedKeys[i];
            if (contest.match(/^abc[0-9]*$/)) {
                tr = "<tr>" + contestArray[contest] + "</tr>"
                $('#beginner').append(tr);
            } else if (contest.match(/^arc[0-9]*$/)) {
                tr = "<tr>" + contestArray[contest] + "</tr>"
                $('#regular').append(tr);
            } else {
                table = contestArray[contest] + "</tr></tbody></table>"
                $('#others').append(table);
            }
        }
    }).fail(function() {
        console.log('error');
    });
}

function showBattle(user, rivals) {
    $('input[name=list]').val(['2']);
    $.when($.getJSON("../atcoder-api/contests", {
        "user": user,
        "rivals": rivals,
    })).done(function(contests_json) {
        var rows = [];
        var win_cnt = 0;
        var lose_cnt = 0;
        var draw_cnt = 0;
        for (contest in contests_json) {
            var rival = "";
            var rival_rank = 0;
            for (r in contests_json[contest]["rival_ranks"]) {
                if (rival_rank == 0 || contests_json[contest]["rival_ranks"][r] < rival_rank) {
                    rival_rank = contests_json[contest]["rival_ranks"][r];
                    rival = r;
                }
            }

            if (Object.keys(contests_json[contest]["rival_ranks"]).length > 1) {
                rival = rival_rank + " (" + rival + ")";
            } else if (rival_rank > 0) {
                rival = rival_rank + "";
            }

            var my_rank = contests_json[contest]["rank"];
            var result = "";
            if (my_rank > 0 && rival_rank > 0) {
                if (my_rank > rival_rank) {
                    result = "LOSE";
                    lose_cnt++;
                } else if (my_rank < rival_rank) {
                    result = "WIN";
                    win_cnt++;
                } else {
                    result = "DRAW";
                    draw_cnt++;
                }
            }
            if (my_rank == 0) {
                my_rank = "";
            }
            rows.push({
                name: "<a target='_blank' href='http://" + contest + ".contest.atcoder.jp/'>" +
                    contests_json[contest]["name"] + "</a>",
                date: contests_json[contest]["start"].replace(/[0-9:]*$/g, ""),
                rank: my_rank,
                rival: rival,
                result: result,
            });
        }

        rows.sort(function(a, b) {
            if (a.date < b.date) return 1;
            if (a.date > b.date) return -1;
            return 0;
        });
        var $table = $('#battle-result');
        $table.bootstrapTable('append', rows);
        $("#lead-text").text(win_cnt + " 勝 " + lose_cnt + " 敗 " + draw_cnt + " 分");
    }).fail(function() {
        console.log('error');
    });
}

function showList(user, rivals) {
    // List Mode
    $('input[name=list]').val(['1']);
    $.when($.getJSON("../atcoder-api/contests"), $.getJSON("../atcoder-api/problems", {
        "user": user,
        "rivals": rivals,
    })).done(function(data_c, data_p) {
        var contests_json = data_c[0];
        var problems_json = data_p[0];
        var contestList = [];
        for (contest in contests_json) {
            link = "<a target='_blank' href='http://" + contest + ".contest.atcoder.jp/'>" + contests_json[contest]["name"] + "</a>";
            contestList[contest] = link;
        }
        var rows = [];
        for (var i = 0; i < problems_json.length; i++) {
            var p = problems_json[i];
            var contest = p["contest"];
            var rival_num = 0;
            if (p["status"] === 'AC') {
                s = "<div class='text-center'><span class='label label-success'>AC</span></div>";
            } else if (Object.keys(p["rivals"]).length > 0) {
                s = "";
                for (rival in p["rivals"]) {
                    s += "<div class='text-center'><span class='label label-danger'>" + rival + "</span></div>";
                    rival_num++;
                }
            } else if (p["status"] !== '') {
                s = "<div class='text-center'><span class='label label-warning'>" + p["status"] + "</span></div>";
            } else {
                s = "";
            }
            var e = "";
            var l = "";
            var f = "";
            if (p["source_length"] > 0) {
                e = "<a target='_blank' href='" + p["fastest_url"] + "'>" + p["exec_time"] + " ms (" + p["fastest_user"] + ")</a>";
                l = "<a target='_blank' href='" + p["shortest_url"] + "'>" + p["source_length"] + " Bytes (" + p["shortest_user"] + ")</a>";
                f = "<a target='_blank' href='" + p["first_url"] + "'>" + p["first_user"] + "</a>";
            }

            rows.push({
                problem_name: "<a target='_blank' href='http://" + contest + ".contest.atcoder.jp/tasks/" + p["id"] + "'>" + p["name"] + "</a>",
                contest_name: contestList[contest],
                status: s,
                solvers: "<a target='_blank' href='http://" + contest + ".contest.atcoder.jp/submissions/all?task_screen_name=" + p["id"] + "&status=AC'>" + p["solvers"] + "</a>",
                exec: e,
                length: l,
                date: contests_json[contest]["start"].replace(/ .*$/g, ''),
                first: f,
                raw_status: p["status"],
                raw_rivals: rival_num,
            });
        }
        var $table = $('#all-problems');
        $table.bootstrapTable('append', rows);
    }).fail(function() {
        console.log('error');
    });

}

function showUserPage(user) {
    // User Page
    $("#header-user").text(user);
    $("#problem-container").remove();

    $.when($.getJSON("../atcoder-api/user", {
        "user": user
    }), $.getJSON("../atcoder-api/problems", {
        "user": user
    })).done(function(json_u, json_p) {
        var user_json = json_u[0];
        var problems_json = json_p[0];
        if (user_json["ac_rank"] == 0) {
            $("#user-contents").remove();
            return;
        }
        $("#ac-num").text(user_json["ac_num"] + " 問");
        $("#short-num").text(user_json["short_num"] + " 問");
        $("#fast-num").text(user_json["fast_num"] + " 問");
        $("#first-num").text(user_json["first_num"] + " 問");

        if (user_json["ac_rank"] > 0) $("#ac-rank").text(user_json["ac_rank"] + " 位");
        if (user_json["short_rank"] > 0) $("#short-rank").text(user_json["short_rank"] + " 位");
        if (user_json["fast_rank"] > 0) $("#fast-rank").text(user_json["fast_rank"] + " 位");
        if (user_json["first_rank"] > 0) $("#first-rank").text(user_json["first_rank"] + " 位");

        var abcs = ["abc_a", "abc_b", "abc_c", "abc_d", ];
        for (var i = 0; i < abcs.length; i++) {
            var doughnutData = [{
                value: user_json[abcs[i]],
                color: "#32CD32",
                label: 'Accepted',
            }, {
                value: user_json["abc_num"] - user_json[abcs[i]],
                color: "#58616A",
            }];
            new Chart(document.getElementById(abcs[i] + "_donuts").getContext("2d")).Doughnut(doughnutData);
            $("#" + abcs[i] + "_num").text(user_json[abcs[i]] + "問 / " + user_json["abc_num"] + " 問");
        }

        var arcs = ["arc_a", "arc_b", "arc_c", "arc_d", ];
        for (var i = 0; i < arcs.length; i++) {
            var doughnutData = [{
                value: user_json[arcs[i]],
                color: "#32CD32",
                label: 'Accepted',
            }, {
                value: user_json["arc_num"] - user_json[arcs[i]],
                color: "#58616A",
            }];
            new Chart(document.getElementById(arcs[i] + "_donuts").getContext("2d")).Doughnut(doughnutData);
            $("#" + arcs[i] + "_num").text(user_json[arcs[i]] + "問 / " + user_json["arc_num"] + " 問");
        }

        var dateKeys = [];
        for (var i = 0; i < problems_json.length; i++) {
            var date = problems_json[i]["ac_time"];
            if (date.length > 0) {
                dateKeys.push(problems_json[i]["ac_time"]);
            }
        }
        dateKeys.sort();
        var data = [];
        for (var i = 0; i < dateKeys.length; i++) {
            data.push({
                date: dateKeys[i],
                value: (i + 1)
            });
        };

        var margin = {
            top: 40,
            right: 40,
            bottom: 40,
            left: 40
        };
        var width = $("#user-solved-parent").width();
        var size = {
            width: width,
            height: 400
        };


        var parseDate = d3.time.format("%Y-%m-%d %H:%M:%S").parse;

        var svg = d3.select("#user-solved-problems")
            .attr("width", size.width)
            .attr("height", size.height)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var x = d3.time.scale()
            .range([0, size.width - margin.left - margin.right]);

        var y = d3.scale.linear()
            .range([size.height - margin.top - margin.bottom, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickFormat(d3.time.format("%Y-%b"));

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

        var line = d3.svg.line()
            .x(function(d) {
                return x(d.date);
            })
            .y(function(d) {
                return y(d.value);
            });


        data.forEach(function(d) {
            d.date = parseDate(d.date);
            d.value = +d.value;
        });

        x.domain(d3.extent(data, function(d) {
            return d.date;
        }));
        y.domain(d3.extent(data, function(d) {
            return d.value;
        }));

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0, " + (size.height - margin.top - margin.bottom) + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".7em")
            .style("text-anchor", "end")
            .text("Solved");

        svg.append("path")
            .datum(data)
            .attr("class", "line")
            .attr("d", line);

    }).fail(function() {
        console.log('error');
    });

}

function showRanking(params) {
    // Ranking Mode
    $("#problem-search-block").remove();
    $("#lead-text").remove();

    var k = "";
    if (params["ranking"] == 1) {
        k = "";
        $("#header-title").text('AtCoder AC 数ランキング');
    }
    if (params["ranking"] == 2) {
        k = "short";
        $("#header-title").text('AtCoder コードゴルフランキング');
    }
    if (params["ranking"] == 3) {
        k = "fast";
        $("#header-title").text('AtCoder 実行速度ランキング');
    }
    if (params["ranking"] == 4) {
        k = "fa";
        $("#header-title").text('AtCoder 最速提出ランキング');
    }

    $.when($.getJSON("../atcoder-api/ranking", {
        "kind": k
    })).done(function(ranking_json) {
        rows = [];
        for (var i = 0; i < Math.min(ranking_json.length, 500) && ranking_json[i]['count'] > 0; i++) {
            rows.push({
                rank: ranking_json[i]['rank'],
                user_name: "<a href='./?kind=list&name=" + ranking_json[i]['user'] + "'>" + ranking_json[i]['user'] + "</a>",
                count: ranking_json[i]['count'],
            });
        }
        var $table = $('#all-ranking');
        $table.bootstrapTable('append', rows);
    }).fail(function() {
        console.log('error');
    });
}

function getParam() {
    var paramsArray = [];
    paramsArray["kind"] = "index";
    paramsArray["name"] = "";
    paramsArray["rivals"] = "";

    var url = location.href;
    parameters = url.split("?");
    if (parameters.length == 1) return paramsArray;

    params = parameters[1].split("&");
    for (i = 0; i < params.length; i++) {
        neet = params[i].split("=");
        paramsArray[neet[0]] = neet[1];
    }

    if (url.indexOf('user.php') != -1) paramsArray["kind"] = "user";
    if (paramsArray["list"] == 1 && paramsArray["kind"] === "index") paramsArray["kind"] = "list";
    if (paramsArray["list"] == 2 && paramsArray["kind"] === "index") paramsArray["kind"] = "battle";
    if (paramsArray["ranking"] > 0) paramsArray["kind"] = "ranking";
    return paramsArray;
}

function battleStyle(row, index) {
    if (row.result === "WIN") {
        return {
            classes: "success"
        };
    } else if (row.result === "LOSE") {
        return {
            classes: "danger"
        };
    } else if (row.result === "DRAW") {
        return {
            classes: "warning"
        };
    } else {
        return {};
    }
}

function listStyle(row, index) {
    if (row.raw_status === "AC") {
        return {
            classes: "success"
        };
    } else if (row.raw_rivals > 0) {
        return {
            classes: "danger"
        };
    } else if (row.raw_status !== "") {
        return {
            classes: "warning"
        };
    } else {
        return {};
    }
}

function numSorter(a, b) {
    a = Number(a.replace(/^.*?<a.*?>([0-9]*).*$/g, "$1"));
    b = Number(b.replace(/^<a.*?>([0-9]*).*$/g, "$1"));
    if (a > b) return 1;
    if (a < b) return -1;
    return 0;
}
