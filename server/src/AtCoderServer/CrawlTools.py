import json
import re
import urllib.request

from bs4 import BeautifulSoup


def get_html_bs(url):
    request = urllib.request.Request(url)
    html = urllib.request.urlopen(request).read()
    soup = BeautifulSoup(html, "html.parser")
    return soup


def get_contest_list():
    bs = get_html_bs("https://atcoder.jp/contest/archive?categories=&mode=check&showLocal=true")
    contests = []
    for link in bs.find_all("a"):
        pattern = r"^https://([a-z0-9\-_]*)\.contest\.atcoder.*$"
        if link.get("href") is None:
            continue
        if re.match(pattern, link["href"]):
            contests.append(re.sub(pattern, r"\1", link["href"]))
    return list(set(contests))


def get_problem_set(contest):
    url = "http://" + contest + ".contest.atcoder.jp/assignments"
    bs = get_html_bs(url)
    problem_map = {}
    for link in bs.find_all("a"):
        pattern = r"^/tasks/([0-9_a-zA-Z]*)$"
        if link.get("href") is None:
            continue
        if re.match(pattern, link["href"]):
            problem_id = re.sub(pattern, r"\1", link["href"])
            problem_map[problem_id] = problem_map.get(problem_id, [])
            problem_map[problem_id].append(link.text)

    if len(problem_map) == 0:
        return {}, {}, ""

    times = {
        "start": bs.find("time", attrs={"id": "contest-start-time"}).text,
        "end": bs.find("time", attrs={"id": "contest-end-time"}).text,
    }
    contest_name = ""
    for span in bs.find_all("span", attrs={"class": "contest-name"}):
        contest_name = span.text

    for k, v in problem_map.items():
        problem_map[k] = v[0] + ". " + v[1]
    print(times)
    return problem_map, times, contest_name


def get_submissions(contest, page):
    url = "http://" + contest + ".contest.atcoder.jp/submissions/all/" + str(page)
    bs = get_html_bs(url)
    max_page = 1

    for link in bs.find_all("a"):
        pattern = r"^/submissions/all/([0-9]*).*$"
        if link.get("href") is None:
            continue
        if re.match(pattern, link["href"]):
            num = re.sub(pattern, r"\1", link["href"])
            num = int(num)
            max_page = max(max_page, num)

    submission_maps = []
    for tr in bs.find_all("tr"):
        tds = []
        for td in tr.find_all("td"):
            if td.find("a"):
                td = td.find("a").get("href")
                td = re.sub(r"^/submissions/([0-9]*)$", r"\1", td)
                td = re.sub(r"^/tasks/(.*)$", r"\1", td)
                td = re.sub(r"^https://atcoder\.jp/user/(.*)$", r"\1", td)
                tds.append(td)
            else:
                tds.append(td.text)

        if len(tds) == 10:
            td_map = {
                "created_time": tds[0],
                "problem_id": tds[1],
                "user_name": tds[2],
                "language": tds[3],
                "point": tds[4],
                "source_length": tds[5].replace("Byte", ""),
                "status": tds[6],
                "exec_time": tds[7].replace("ms", ""),
                "memory_usage": tds[8],
                "id": int(tds[9]),
            }
        elif len(tds) == 8:
            td_map = {
                "created_time": tds[0],
                "problem_id": tds[1],
                "user_name": tds[2],
                "language": tds[3],
                "point": tds[4],
                "source_length": tds[5].replace("Byte", ""),
                "status": tds[6],
                "exec_time": 0,
                "memory_usage": 0,
                "id": int(tds[7]),
            }
        else:
            continue
        if td_map["status"] == "WJ" or re.match(r"[0-9]*/[0-9]", td_map["status"]):
            return [], -1
        submission_maps.append(td_map)
    return submission_maps, max_page


def get_results(contest):
    url = "http://" + contest + ".contest.atcoder.jp/standings"
    bs = get_html_bs(url)
    lines = bs.text.split("\n")
    json_str = ""
    for line in lines:
        if re.match(r"^.*data:", line):
            json_str = re.sub(r"^.*?data:", "", line)
    if json_str == "":
        return []
    standings = json.loads(json_str)
    if standings is None:
        return []
    results = []
    for standing in standings:
        results.append((standing["user_screen_name"], standing["rank"]))
    return results
