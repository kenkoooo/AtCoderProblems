table! {
    accepted_count (user_id) {
        user_id -> Varchar,
        problem_count -> Int4,
    }
}

table! {
    contests (id) {
        id -> Varchar,
        start_epoch_second -> Int8,
        duration_second -> Int8,
        title -> Varchar,
        rate_change -> Varchar,
    }
}

table! {
    contest_problem (contest_id, problem_id) {
        contest_id -> Varchar,
        problem_id -> Varchar,
    }
}

table! {
    fastest (problem_id) {
        contest_id -> Varchar,
        problem_id -> Varchar,
        submission_id -> Int8,
    }
}

table! {
    first (problem_id) {
        contest_id -> Varchar,
        problem_id -> Varchar,
        submission_id -> Int8,
    }
}

table! {
    language_count (user_id, simplified_language) {
        user_id -> Varchar,
        simplified_language -> Varchar,
        problem_count -> Int4,
    }
}

table! {
    points (problem_id) {
        problem_id -> Varchar,
        point -> Nullable<Float8>,
        predict -> Nullable<Float8>,
    }
}

table! {
    predicted_rating (user_id) {
        user_id -> Varchar,
        rating -> Nullable<Float8>,
    }
}

table! {
    problems (id) {
        id -> Varchar,
        contest_id -> Varchar,
        title -> Varchar,
    }
}

table! {
    rated_point_sum (user_id) {
        user_id -> Varchar,
        point_sum -> Float8,
    }
}

table! {
    shortest (problem_id) {
        contest_id -> Varchar,
        problem_id -> Varchar,
        submission_id -> Int8,
    }
}

table! {
    solver (problem_id) {
        problem_id -> Varchar,
        user_count -> Int4,
    }
}

table! {
    submissions (id) {
        id -> Int8,
        epoch_second -> Int8,
        problem_id -> Varchar,
        contest_id -> Varchar,
        user_id -> Varchar,
        language -> Varchar,
        point -> Float8,
        length -> Int4,
        result -> Varchar,
        execution_time -> Nullable<Int4>,
    }
}

table! {
    max_streaks (user_id) {
        user_id -> Varchar,
        streak -> Int8,
    }
}

table! {
    submission_count (user_id) {
        user_id -> Varchar,
        count -> Int8,
    }
}

allow_tables_to_appear_in_same_query!(
    accepted_count,
    contests,
    contest_problem,
    fastest,
    first,
    language_count,
    max_streaks,
    points,
    predicted_rating,
    problems,
    rated_point_sum,
    shortest,
    solver,
    submissions,
    submission_count,
);
