-- Max points for each problem from rated contest submissions

select
    cp.problem_id,
    max(s.point) as point,
    null::double precision as predict  -- Placeholder for difficulty prediction
from {{ ref('int_rated_contests') }} rc
inner join {{ ref('stg_contest_problem') }} cp on rc.contest_id = cp.contest_id
inner join {{ ref('stg_submissions') }} s on cp.problem_id = s.problem_id
group by cp.problem_id
