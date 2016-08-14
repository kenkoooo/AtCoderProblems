$(document).ready(function () {
    var params = getParam();
    if (params['kind'] !== "list") $("#problem-list").remove();
    if (params['kind'] !== "index") $("#problem-category").remove();
    if (params['kind'] !== "battle") $("#battle-list").remove();
    if (params['kind'] !== "ranking") {
        $("#ranking").remove();
    }
    if (params["kind"] !== "user") {
        $("#user-container").remove();
    }

    var user = params["name"];
    var rivals = params["rivals"];
    $("#user_name_text").val(user);
    $("#rival_text").val(rivals);

    if (params["kind"] === "index") {
        showCategory(user, rivals);
    } else if (params["kind"] === "list") {
        showList(user, rivals);
    } else if (params["kind"] === "battle") {
        showBattle(user, rivals);
    } else if (params["kind"] === "ranking") {
        showRanking(params["ranking"]);
    } else if (params["kind"] === "user") {
        showUserPage(user)
    }

    var user_href = $("#user-page-link").attr("href");
    $("#user-page-link").attr("href", user_href + "&name=" + params["name"]);
    var header_href = $("#header-link").attr("href");
    $("#header-link").attr("href", header_href + "&name=" + params["name"]);
});

function showCategory(user, rivals) {
    $("input[name=list]").val(["0"]);
    $.when(
        $.getJSON("/atcoder/json/problems_simple.json"),
        $.getJSON("/atcoder/json/contests.json"),
        $.getJSON("/atcoder-api/problems", {
            "user": user,
            "rivals": rivals
        })).done(function (json_simple, json_contests, json_problems) {
            json_simple = json_simple[0];
            json_contests = json_contests[0];
            json_problems = json_problems[0];

            var contest_map = {};
            for (var i = 0; i < json_contests.length; i++) {
                var contest = json_contests[i];
                contest_map[contest["id"]] = {
                    "id": contest["id"],
                    "name": contest["name"],
                    "start": contest["start"].substring(0, 10),
                    "problems": []
                };
            }

            var problems_unified = {};
            for (var i = 0; i < json_simple.length; i++) {
                var problem = json_simple[i];
                problems_unified[problem["id"]] = {
                    "name": problem["name"],
                    "id": problem["id"],
                    "contest": problem["contest"],
                    "classes": ""
                };
                contest_map[problem["contest"]]["problems"].push(problem["id"]);
            }
            for (var i = 0; i < json_problems.length; i++) {
                var problem = json_problems[i];
                problems_unified[problem["id"]]["status"] = problem["status"];
                if (problem["status"] === "AC") {
                    problems_unified[problem["id"]]["classes"] = "classes_success";
                } else if (problem["rivals"].length > 0) {
                    problems_unified[problem["id"]]["classes"] = "classes_danger";
                } else {
                    problems_unified[problem["id"]]["classes"] = "classes_warning";
                }
            }

            var grand = [];
            var beginner = [];
            var regular = [];
            var other = [];
            for (var key in contest_map) {
                var contest = contest_map[key];
                if (key.match(/^agc[0-9]*$/)) {
                    contest.problems = contest.problems.sort();
                    var ps = [];
                    for (var i = 0; i < contest.problems.length; i++) {
                        var pu = problems_unified[contest.problems[i]];
                        var p_str = "<a href='https://" +
                            contest.id + ".contest.atcoder.jp/tasks/" +
                            pu.id + "' target='_blank'>" +
                            pu.name + "</a><span style='display:none;'>" +
                            pu.classes + "</span>";
                        ps.push(p_str);
                    }
                    var row = {
                        "contest": "<a href='https://" +
                        contest.id + ".contest.atcoder.jp/' target='_blank'>" +
                        contest.id.toUpperCase() + "</a>",
                        "start": contest.start
                    };
                    {
                        var k = ps.length;
                        row["problem_f"] = k > 0 ? ps[--k] : "-";
                        row["problem_e"] = k > 0 ? ps[--k] : "-";
                        row["problem_d"] = k > 0 ? ps[--k] : "-";
                        row["problem_c"] = k > 0 ? ps[--k] : "-";
                        row["problem_b"] = k > 0 ? ps[--k] : "-";
                        row["problem_a"] = k > 0 ? ps[--k] : "-";
                    }
                    grand.push(row);

                } else if (key.match(/^a[br]c[0-9]*$/)) {
                    contest.problems = contest.problems.sort();
                    var ps = [];
                    for (var i = 0; i < contest.problems.length; i++) {
                        var pu = problems_unified[contest.problems[i]];
                        var p_str = "<a href='https://" +
                            contest.id + ".contest.atcoder.jp/tasks/" +
                            pu.id + "' target='_blank'>" +
                            pu.name + "</a><span style='display:none;'>" +
                            pu.classes + "</span>";
                        ps.push(p_str);
                    }
                    var row = {
                        "contest": "<a href='https://" +
                        contest.id + ".contest.atcoder.jp/' target='_blank'>" +
                        contest.id.toUpperCase() + "</a>",
                        "start": contest.start
                    };
                    {
                        var k = ps.length;
                        row["problem_d"] = k > 0 ? ps[--k] : "-";
                        row["problem_c"] = k > 0 ? ps[--k] : "-";
                        row["problem_b"] = k > 0 ? ps[--k] : "-";
                        row["problem_a"] = k > 0 ? ps[--k] : "-";
                    }

                    if (key.indexOf("abc") != -1)
                        beginner.push(row);
                    else
                        regular.push(row);
                } else {
                    contest.problems = contest.problems.sort(function (a, b) {
                        var problem_a = problems_unified[a];
                        var problem_b = problems_unified[b];
                        if (problem_a.name < problem_b.name) return -1;
                        if (problem_a.name > problem_b.name) return 1;
                        return 0;
                    });
                    var header = "<strong>" + contest.start + " <a target='_blank' href='http://" + contest.id +
                        ".contest.atcoder.jp/'>" + contest.name + "</a></strong>";

                    var table = "<table class='table table-bordered'><tbody><tr>";
                    for (var i = 0; i < contest.problems.length; i++) {
                        var problem = problems_unified[contest.problems[i]];
                        var classes = "";
                        if (problem.classes == "classes_success") {
                            classes = "success";
                        } else if (problem.classes == "classes_warning") {
                            classes = "warning";
                        } else if (problem.classes == "classes_danger") {
                            classes = "danger";
                        }
                        table += "<td class='" +
                            classes +
                            "'>" +
                            "<a href='http://" +
                            contest.id +
                            ".contest.atcoder.jp/tasks/" +
                            problem.id +
                            "' target='_blank'>" +
                            problem.name +
                            "</a>" +
                            "</td>";
                    }
                    table += "</tr></tbody></table>";
                    other.push({
                        "header": header,
                        "table": table,
                        "start": contest.start
                    });
                }
            }

            grand.sort(function (a, b) {
                if (a.start > b.start) return -1;
                if (a.start < b.start) return 1;
                return 0;
            });
            beginner.sort(function (a, b) {
                if (a.start > b.start) return -1;
                if (a.start < b.start) return 1;
                return 0;
            });
            regular.sort(function (a, b) {
                if (a.start > b.start) return -1;
                if (a.start < b.start) return 1;
                return 0;
            });
            other.sort(function (a, b) {
                if (a.start > b.start) return -1;
                if (a.start < b.start) return 1;
                return 0;
            });
            $("#grand").bootstrapTable("append", grand);
            $("#beginner").bootstrapTable("append", beginner);
            $("#regular").bootstrapTable("append", regular);

            other.forEach(function (element, index, array) {
                $("#others").append(element.header);
                $("#others").append(element.table);
            });

        }
    ).fail(function () {
        console.log("error");
    });
}

function categoryCellStyle(value, row, index) {
    if (value.indexOf("classes_warning") != -1)
        return {classes: "warning"};
    if (value.indexOf("classes_success") != -1)
        return {classes: "success"};
    if (value.indexOf("classes_danger") != -1)
        return {classes: "danger"};
    return {};
}

function showBattle(user, rivals) {
    $("input[name=list]").val(["2"]);
    $.when(
        $.getJSON("/atcoder-api/results", {
            "user": user,
            "rivals": rivals,
        }),
        $.getJSON("/atcoder/json/contests.json")
    ).done(function (json_results, json_contests) {
            json_results = json_results[0];
            json_contests = json_contests[0];

            var result_map = {};
            for (var i = 0; i < json_contests.length; i++)
                result_map[json_contests[i].id] = [];
            for (var i = 0; i < json_results.length; i++) {
                var result = json_results[i];
                if (result.contest in result_map)
                    result_map[result.contest].push({
                        "user": result.user,
                        "rank": result.rank
                    });
            }

            var rows = [];
            var win_cnt = 0;
            var lose_cnt = 0;
            var draw_cnt = 0;
            for (var i = 0; i < json_contests.length; i++) {
                var contest = json_contests[i];
                var rival = "";
                var rival_rank = 0;
                var my_rank = 0;
                for (var j = 0; j < result_map[contest.id].length; j++) {
                    var result = result_map[contest.id][j];
                    if (result.user.toLowerCase() === user.toLowerCase()) {
                        my_rank = result.rank;
                    } else if (rival_rank == 0 || result.rank < rival_rank) {
                        rival_rank = result.rank;
                        rival = result.user;
                    }
                }
                if (result_map[contest.id].length >= 3) {
                    rival = rival_rank + " (" + rival + ")";
                } else if (rival_rank > 0) {
                    rival = rival_rank + "";
                }

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
                if (my_rank === 0) {
                    my_rank = "";
                }
                rows.push({
                    name: "<a target='_blank' href='http://" + contest.id + ".contest.atcoder.jp/'>" +
                    contest.name + "</a>",
                    date: contest.start,
                    rank: my_rank,
                    rival: rival,
                    result: result
                });
            }

            rows.sort(function (a, b) {
                if (a.date < b.date) return 1;
                if (a.date > b.date) return -1;
                return 0;
            });
            var $table = $("#battle-result");
            $table.bootstrapTable("append", rows);
            $("#lead-text").text(win_cnt + " 勝 " + lose_cnt + " 敗 " + draw_cnt + " 分");
        }
    ).fail(function () {
        console.log("error");
    });
}

function showList(user, rivals) {
    // List Mode
    $("input[name=list]").val(["1"]);
    $.when(
        $.getJSON("/atcoder/json/problems.json"),
        $.getJSON("/atcoder/json/contests.json"),
        $.getJSON("/atcoder-api/problems", {
            "user": user,
            "rivals": rivals,
        })).done(function (json_detailed_problems, json_contests, json_problems) {
        json_detailed_problems = json_detailed_problems[0];
        json_contests = json_contests[0];
        json_problems = json_problems[0];

        var user_result_map = {};
        for (var i = 0; i < json_problems.length; i++) {
            var obj = json_problems[i];
            user_result_map[obj.id] = obj;
        }
        var contest_dict = {};
        for (var i = 0; i < json_contests.length; i++) {
            var contest = json_contests[i];
            contest_dict[contest.id] = contest;
        }

        var rows = [];
        for (var i = 0; i < json_detailed_problems.length; i++) {
            var p = json_detailed_problems[i];
            var status = "";
            var raw_status = "";
            var rival_num = 0;
            if (p.id in user_result_map) {
                var result = user_result_map[p.id];
                raw_status = result.status;
                if (result.status === "AC") {
                    status = "<div class='text-center'><span class='label label-success'>AC</span></div>";
                } else if (result.rivals.length > 0) {
                    for (var j = 0; j < result.rivals.length; j++)
                        status += "<div class='text-center'><span class='label label-danger'>" +
                            result.rivals[j] + "</span></div>";
                } else if (result.status !== "") {
                    status = "<div class='text-center'><span class='label label-warning'>" + result.status + "</span></div>";
                }
                rival_num = result.rivals.length;
            }

            var fastest = "";
            var first = "";
            var shortest = "";
            if (p.source_length > 0) {
                fastest = "<a href='http://";
                if (p.fastest_contest === "")
                    p.fastest_contest = p.contest;
                fastest += p.fastest_contest + ".contest.atcoder.jp/submissions/" +
                    p.fastest_id + "' target='_blank'>" +
                    p.exec_time + " ms <br/>(" +
                    p.fastest_user + ")</a>";

                first = "<a href='http://";
                if (p.first_contest === "")
                    p.first_contest = p.contest;
                first += p.first_contest + ".contest.atcoder.jp/submissions/" +
                    p.first_id + "' target='_blank'>" +
                    p.first_user + "</a>";

                shortest = "<a href='http://";
                if (p.shortest_contest === "")
                    p.shortest_contest = p.contest;
                shortest += p.shortest_contest + ".contest.atcoder.jp/submissions/" +
                    p.shortest_id + "' target='_blank'>" +
                    p.source_length + " bytes <br/>(" +
                    p.shortest_user + ")</a>";
            }

            var contest_name = contest_dict[p.contest].name;
            if (contest_name.length > 30) {
                contest_name = p.contest.toUpperCase();
            }
            var problem_name = p.name;
            if (problem_name.length > 30) {
                problem_name = problem_name.substring(0, 27) + "...";
            }


            rows.push({
                problem_name_string: p.name,
                problem_name: "<a target='_blank' href='http://" + p.contest + ".contest.atcoder.jp/tasks/" +
                p.id + "'>" + problem_name + "</a>",
                contest_name: "<a href='http://" + p.contest + ".contest.atcoder.jp/' target='_blank'>" +
                contest_name + "</a>",
                status: status,
                solvers: "<a target='_blank' href='http://" + p.contest +
                ".contest.atcoder.jp/submissions/all?task_screen_name=" + p.id + "&status=AC'>" + p.solvers +
                "</a>",
                exec: fastest,
                length: shortest,
                difficulty: p.difficulty,
                date: contest_dict[p.contest].start.substring(0, 10),
                first: first,
                raw_status: raw_status,
                raw_rivals: rival_num
            });
        }
        rows.sort(function (a, b) {
            if (a.date < b.date) return 1;
            if (a.date > b.date) return -1;
            if (a.problem_name_string < b.problem_name_string) return -1;
            if (a.problem_name_string > b.problem_name_string) return 1;
            return 0;
        });
        var $table = $("#all-problems");
        $table.bootstrapTable("append", rows);
    }).fail(function () {
        console.log("error");
    });

}

function showUserPage(user) {
    // User Page
    $("#header-user").text(user);
    $("#problem-container").remove();

    var abc_charts = [];
    var abcs = ["abc_a", "abc_b", "abc_c", "abc_d",];
    for (var i = 0; i < abcs.length; i++) {
        abc_charts.push(c3.generate({
            bindto: "#" + abcs[i] + "_donuts",
            size: {
                height: 200,
                width: 200
            },
            data: {
                columns: [
                    ["Accepted", 0],
                    ["Trying", 0],
                ],
                type: "pie",
                colors: {
                    Accepted: "#32CD32",
                    Trying: "#58616A",
                },
                order: null
            },
        }));
    }
    var arc_charts = [];
    var arcs = ["arc_a", "arc_b", "arc_c", "arc_d",];
    for (var i = 0; i < arcs.length; i++) {
        arc_charts.push(c3.generate({
            bindto: "#" + arcs[i] + "_donuts",
            size: {
                height: 200,
                width: 200
            },
            data: {
                columns: [
                    ["Accepted", 0],
                    ["Trying", 0],
                ],
                type: "pie",
                colors: {
                    Accepted: "#32CD32",
                    Trying: "#58616A",
                },
                order: null
            }
        }));
    }
    var line_chart = c3.generate({
        bindto: "#user-solved-problems",
        data: {
            x: "x",
            columns: []
        },
        axis: {
            x: {
                type: 'timeseries',
                tick: {
                    count: 10,
                    format: '%Y-%m-%d'
                }
            }
        }
    });
    var bar_chart = c3.generate({
        bindto: "#user-solved-daily",
        data: {
            x: "x",
            columns: [],
            type: 'bar',
            colors: {
                Accepted: "#32CD32",
            },
        },
        axis: {
            x: {
                type: 'timeseries',
                tick: {
                    count: 10,
                    format: '%Y-%m-%d'
                }
            }
        },
        bar: {
            width: {
                ratio: 0.02 // this makes bar width 50% of length between ticks
            }
        }
    });

    $.when($.getJSON("/atcoder-api/user", {
        "user": user
    }), $.getJSON("/atcoder-api/problems", {
        "user": user
    })).done(function (user_json, problems_json) {
        user_json = user_json[0];
        problems_json = problems_json[0];
        if (user_json["ac_rank"] === 0) {
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

        for (var i = 0; i < abcs.length; i++) {
            abc_charts[i].load({
                columns: [
                    ["Accepted", user_json[abcs[i]]],
                    ["Trying", user_json["abc_num"] - user_json[abcs[i]]],
                ]
            });
            $("#" + abcs[i] + "_num").text(user_json[abcs[i]] + "問 / " + user_json["abc_num"] + " 問");
        }

        for (var i = 0; i < arcs.length; i++) {
            var arc_problems_num = user_json["arc_num"];
            // 58th 以降の AtCoder Regular Contest は CD 問題しか存在しない。
            if (i < 2) {
                arc_problems_num = 57;
            }
            arc_charts[i].load({
                columns: [
                    ["Accepted", user_json[arcs[i]]],
                    ["Trying", arc_problems_num - user_json[arcs[i]]]
                ]
            });
            $("#" + arcs[i] + "_num").text(user_json[arcs[i]] + "問 / " + arc_problems_num + " 問");
        }

        var dateKeys = [];
        for (var i = 0; i < problems_json.length; i++) {
            var date = problems_json[i]["ac_time"];
            if (date.length > 0) {
                dateKeys.push(problems_json[i]["ac_time"]);
            }
        }
        dateKeys.sort();
        var x_ticks = ["x"];
        var data = ["Accepted"];
        for (var i = 0; i < dateKeys.length; i++) {
            if (i < dateKeys.length - 1 && dateKeys[i].replace(/ [0-9]*:[0-9]*:[0-9]*$/g, "") === dateKeys[i + 1].replace(/ [0-9]*:[0-9]*:[0-9]*$/g, "")) continue;
            x_ticks.push(dateKeys[i].replace(/ [0-9]*:[0-9]*:[0-9]*$/g, ""));
            data.push(i + 1);
        }
        line_chart.load({
            columns: [x_ticks, data]
        });
        for (var i = data.length - 1; i >= 2; i--) data[i] -= data[i - 1];
        bar_chart.load({
            columns: [x_ticks, data]
        });


    }).fail(function () {
        console.log("error");
    });

}

function showRanking(k) {
    // Ranking Mode
    $("#problem-search-block").remove();
    $("#lead-text").remove();

    if (k === "2") {
        k = "short";
        $("#header-title").text("AtCoder コードゴルフランキング");
    } else if (k === "3") {
        k = "fast";
        $("#header-title").text("AtCoder 実行速度ランキング");
    } else if (k === "4") {
        k = "first";
        $("#header-title").text("AtCoder 最速提出ランキング");
    } else {
        k = "ac";
        $("#header-title").text("AtCoder AC 数ランキング");
    }

    $.when($.getJSON("/atcoder-api/ranking", {
        "kind": k
    })).done(function (ranking_json) {
        var rows = [];
        for (var i = 0; i < Math.min(ranking_json.length, 500) && ranking_json[i]["count"] > 0; i++) {
            rows.push({
                rank: ranking_json[i]["rank"],
                user_name: "<a href='./?kind=list&name=" + ranking_json[i]["user_name"] + "'>" +
                ranking_json[i]["user_name"] + "</a>",
                count: ranking_json[i]["count"],
            });
        }
        var $table = $("#all-ranking");
        $table.bootstrapTable("append", rows);
    }).fail(function () {
        console.log("error");
    });
}

function getParam() {
    var paramsArray = {};
    paramsArray["kind"] = "index";
    paramsArray["name"] = "";
    paramsArray["rivals"] = "";
    paramsArray["ranking"] = 0;

    var url = location.href;
    var parameters = url.split("?");
    if (parameters.length === 1) return paramsArray;

    var splitparams = parameters[1].split("&");
    for (
        var i = 0; i < splitparams.length; i++) {
        var neet = splitparams[i].split("=");
        paramsArray[neet[0]] = neet[1];
    }

    if (url.indexOf("user.php") !== -1) paramsArray["kind"] = "user";
    if (paramsArray["list"] == 1 && paramsArray["kind"] === "index") paramsArray["kind"] = "list";
    if (paramsArray["list"] == 2 && paramsArray["kind"] === "index") paramsArray["kind"] = "battle";
    if (paramsArray["ranking"] > 0) paramsArray["kind"] = "ranking";
    paramsArray["rivals"] = paramsArray["rivals"].replace(/\%2C/g, ",");
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
