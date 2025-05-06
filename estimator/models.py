from pydantic import BaseModel, ConfigDict


class Problem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    contest_id: str
    problem_index: str
    name: str
    title: str


class Contest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    start_epoch_second: int
    duration_second: int
    title: str
    rate_change: str


class ProblemModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    slope: float | None = None
    intercept: float | None = None
    variance: float | None = None
    difficulty: int | None = None
    discrimination: float | None = None
    irt_loglikelihood: float | None = None
    irt_users: int | None = None
    is_experimental: bool | None = None


class TaskInfo(BaseModel):
    model_config = ConfigDict(extra="ignore")
    Assignment: str
    TaskName: str
    TaskScreenName: str


class TotalResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    Count: int
    Accepted: int
    Penalty: int
    Score: int
    Elapsed: int


class TaskResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    Count: int
    Failure: int
    Penalty: int
    Score: int
    Elapsed: int
    Status: int
    Pending: bool
    Frozen: bool


class StandingsData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    Rank: int
    UserScreenName: str
    IsRated: bool
    OldRating: int
    Competitions: int
    TotalResult: TotalResult
    TaskResults: dict[str, TaskResult]


class Standings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    TaskInfo: list[TaskInfo]
    StandingsData: list[StandingsData]
