$(document).ready(function() {
    params = getParam();
    if (params['kind'] !== "list") $("#problem-list").remove();
    if (params['kind'] !== "index") $("#problem-category").remove();
    if (params['kind'] !== "ranking") {
        $("#ranking").remove();
    }
    if (params['kind'] !== "user") {
        $("#user-container").remove();
    }

    user = params['name'];
    rivals = params['rivals'].replace(/\%2C/g, ",");
    $("#user_name_text").val(user);
    $("#rival_text").val(rivals);
    //Category Mode
    if (params['kind'] === 'index') {
        $.when($.getJSON("../atcoder-api/contests"), $.getJSON("../atcoder-api/problems", {
            "user": user,
            "rivals": rivals,
        })).done(function(data_c, data_p) {
            contests_json = data_c[0];
            problems_json = data_p[0];
            contestArray = {};
            for (contest in contests_json) {
                link = "<td><a href='http://" + contest + ".contest.atcoder.jp/' target='_blank'>" + contest + "</a></td>";
                if (contest.match(/^a[br]c[0-9]*$/)) {
                    contestArray[contest] = link
                } else {
                    link = "<strong><a target='_blank' href='http://" + contest + ".contest.atcoder.jp/'>" + contests_json[contest]["name"] + "</a></strong><table class='table table-bordered'><tbody><tr>";
                    contestArray[contest] = link;
                }
            }
            for (problem in problems_json) {
                contest = problems_json[problem]["contest"];
                contestArray[contest] += "<td ";
                if (problems_json[problem]["status"] === 'AC') {
                    contestArray[contest] += "class='success'"
                } else if (Object.keys(problems_json[problem]["rivals"]).length > 0) {
                    contestArray[contest] += "class='danger'"
                } else if (problems_json[problem]["status"] !== '') {
                    contestArray[contest] += "class='warning'"
                }
                contestArray[contest] += "><a href='http://" + contest + ".contest.atcoder.jp/tasks/" + problem + "' target='_blank'>" + problems_json[problem]["name"] + "</a></td>";
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

    } else if (params['kind'] === 'list') {
        $.when($.getJSON("../atcoder-api/contests"), $.getJSON("../atcoder-api/problems", {
            "user": user,
            "rivals": rivals,
        })).done(function(data_c, data_p) {
            contests_json = data_c[0];
            problems_json = data_p[0];
            contestList = [];
            for (contest in contests_json) {
                link = "<a target='_blank' href='http://" + contest + ".contest.atcoder.jp/'>" + contests_json[contest]["name"] + "</a>";
                contestList[contest] = link;
            }
            rows = [];
            for (problem in problems_json) {
                p = problems_json[problem];
                contest = p["contest"];
                rival_num = 0;
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
                    problem_name: "<a target='_blank' href='http://" + contest + ".contest.atcoder.jp/tasks/" + problem + "'>" + p["name"] + "</a>",
                    contest_name: contestList[contest],
                    status: s,
                    solvers: p["solvers"],
                    exec: e,
                    length: l,
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
    } else if (params['kind'] === 'ranking') {
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
            "kind": k,
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
    } else if (params['kind'] === 'user') {
        // User Page
        $("#header-user").text(params["name"]);
        $("#problem-container").remove();

        $.when($.getJSON("../atcoder-api/user", {
            "user": user
        })).done(function(json) {
            if (json["ac_rank"] == 0) {
                $("#user-contents").remove();
                return;
            }
            $("#ac-num").text(json["ac_num"] + " 問");
            $("#short-num").text(json["short_num"] + " 問");
            $("#fast-num").text(json["fast_num"] + " 問");
            $("#first-num").text(json["first_num"] + " 問");

            if (json["ac_rank"] > 0) $("#ac-rank").text(json["ac_rank"] + " 位");
            if (json["short_rank"] > 0) $("#short-rank").text(json["short_rank"] + " 位");
            if (json["fast_rank"] > 0) $("#fast-rank").text(json["fast_rank"] + " 位");
            if (json["first_rank"] > 0) $("#first-rank").text(json["first_rank"] + " 位");

            var abcs = [
                "abc_a", "abc_b", "abc_c", "abc_d",
            ];
            for (var i = 0; i < abcs.length; i++) {
                var doughnutData = [{
                    value: json[abcs[i]],
                    color: "#32CD32",
                    label: 'Accepted',
                }, {
                    value: json["abc_num"] - json[abcs[i]],
                    color: "#58616A",
                }];
                new Chart(document.getElementById(abcs[i] + "_donuts").getContext("2d")).Doughnut(doughnutData);
                $("#" + abcs[i] + "_num").text(json[abcs[i]] + "問 / " + json["abc_num"] + " 問");
            }
            var arcs = [
                "arc_a", "arc_b", "arc_c", "arc_d",
            ];
            for (var i = 0; i < arcs.length; i++) {
                var doughnutData = [{
                    value: json[arcs[i]],
                    color: "#32CD32",
                    label: 'Accepted',
                }, {
                    value: json["arc_num"] - json[arcs[i]],
                    color: "#58616A",
                }];
                new Chart(document.getElementById(arcs[i] + "_donuts").getContext("2d")).Doughnut(doughnutData);
                $("#" + arcs[i] + "_num").text(json[arcs[i]] + "問 / " + json["arc_num"] + " 問");
            }

        }).fail(function() {
            console.log('error');
        });
    }

    var user_href = $("#user-page-link").attr("href");
    $("#user-page-link").attr("href", user_href + '&name=' + params["name"]);
    var header_href = $("#header-link").attr("href");
    $("#header-link").attr("href", header_href + '&name=' + params["name"]);

});

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
    if (paramsArray["ranking"] > 0) paramsArray["kind"] = "ranking";
    return paramsArray;
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
