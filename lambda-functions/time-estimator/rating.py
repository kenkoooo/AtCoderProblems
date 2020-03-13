import math
from collections import defaultdict
from typing import List, Optional
import enum


class ContestType(enum.Enum):
    OLD_UNRATED_ABC = 1199, 1600, 800, False   # 4 problems ABC before official rating system
    OLD_UNRATED_ARC = 9999, 9999, 1200, False  # ARC *AND* sponsored contests before official rating system

    OLD_ABC = 1199, 1600, 800, True   # 4 problems ABC
    NEW_ABC = 1999, 2400, 800, True   # 6 problems ABC
    NEW_ARC = 2799, 3200, 1200, True  # Officially rated ARC
    AGC = 9999, 9999, 1600, True

    UNRATED = None, None, None, None

    def __init__(self, qualified_bound: float, rating_bound: float, default_perf: float, is_rated: bool):
        self.qualified_bound = qualified_bound
        self.rating_bound = rating_bound
        self.default_perf = default_perf
        self.is_rated = is_rated


def adjust_rating(raw_rating: float, n: int) -> int:
    f_1 = 1.
    f_inf = 1 / (19 ** 0.5)
    f_n = ((1 - 0.81 ** n) ** 0.5) / ((19 ** 0.5) * (1 - 0.9 ** n))
    discounted_rating = raw_rating - (f_n - f_inf) / (f_1 - f_inf) * 1200
    if discounted_rating >= 400:
        return int(discounted_rating)
    else:
        return int(max(1., 400 / math.exp((400 - discounted_rating) / 400)))


class RatingSystem(object):
    def __init__(self):
        self.past_performances = defaultdict(list)
        self.past_rounded_performances = defaultdict(list)

    def update(self, standings: List[str], contest_type: ContestType):
        is_first_contest = not self.past_performances
        qualified_contestants = [contestant for contestant in standings if (self.calc_rating(contestant) or 0) <= contest_type.qualified_bound]
        a_perfs = [self.calc_a_perf(contestant, contest_type) for contestant in qualified_contestants]

        predicted_rank_cache = dict()
        for i, contestant in enumerate(qualified_contestants):
            ub, lb = 10000, -10000
            while round(lb) < round(ub):
                m = (lb + ub) / 2
                if m not in predicted_rank_cache:
                    predicted_rank = 0
                    for a_perf in a_perfs:
                        predicted_rank += 1. / (1. + (6.0 ** ((m - a_perf) / 400)))
                    predicted_rank_cache[m] = predicted_rank
                predicted_rank = predicted_rank_cache[m]
                if predicted_rank < i + 0.5:
                    ub = m
                else:
                    lb = m
            perf = round(lb)
            if is_first_contest:
                perf = (perf - contest_type.default_perf) * 1.5 + contest_type.default_perf
            self.past_performances[contestant].append(perf)
            rounded_performance = min(perf, contest_type.rating_bound)
            self.past_rounded_performances[contestant].append(rounded_performance)

    def competition_count(self, contestant: str) -> int:
        return len(self.past_performances.get(contestant, []))

    def calc_rating(self, contestant: str) -> Optional[float]:
        if not self.past_rounded_performances[contestant]:
            return None
        exp_perf_sum, weight_sum = 0., 0.
        for i, past_perf in enumerate(reversed(self.past_rounded_performances[contestant])):
            weight = 0.9 ** i
            exp_perf = 2. ** (past_perf / 800)
            weight_sum += weight
            exp_perf_sum += exp_perf * weight
        exp_perf_average = exp_perf_sum / weight_sum
        raw_rating = math.log2(exp_perf_average) * 800
        return adjust_rating(raw_rating, self.competition_count(contestant))

    def calc_a_perf(self, contestant: str, contest_type: ContestType) -> float:
        if not self.past_performances[contestant]:
            return contest_type.default_perf
        perf_sum, weight_sum = 0., 0.
        for i, past_perf in enumerate(reversed(self.past_performances[contestant])):
            weight = 0.9 ** i
            perf_sum += past_perf * weight
            weight_sum += weight
        return perf_sum / weight_sum

    def calc_adjusted_a_perf(self, contestant: str, contest_type: ContestType) -> float:
        raw_a_perf = self.calc_a_perf(contestant, contest_type)
        return adjust_rating(raw_a_perf, self.competition_count(contestant))
