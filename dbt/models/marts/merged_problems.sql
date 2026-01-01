-- Merged problem data combining problems with fastest/shortest/first submissions,
-- points, and solver counts

select
    p.problem_id as id,
    p.contest_id,
    p.problem_index,
    p.name,
    p.title,
    sh.submission_id as shortest_submission_id,
    sh.contest_id as shortest_contest_id,
    sh_sub.user_id as shortest_user_id,
    fa.submission_id as fastest_submission_id,
    fa.contest_id as fastest_contest_id,
    fa_sub.user_id as fastest_user_id,
    fi.submission_id as first_submission_id,
    fi.contest_id as first_contest_id,
    fi_sub.user_id as first_user_id,
    sh_sub.length as source_code_length,
    fa_sub.execution_time,
    pt.point,
    so.user_count as solver_count
from {{ ref('stg_problems') }} p
left join {{ ref('shortest') }} sh on sh.problem_id = p.problem_id
left join {{ ref('fastest') }} fa on fa.problem_id = p.problem_id
left join {{ ref('first') }} fi on fi.problem_id = p.problem_id
left join {{ ref('stg_submissions') }} sh_sub on sh.submission_id = sh_sub.submission_id
left join {{ ref('stg_submissions') }} fa_sub on fa.submission_id = fa_sub.submission_id
left join {{ ref('stg_submissions') }} fi_sub on fi.submission_id = fi_sub.submission_id
left join {{ ref('points') }} pt on pt.problem_id = p.problem_id
left join {{ ref('solver') }} so on so.problem_id = p.problem_id
order by p.problem_id
