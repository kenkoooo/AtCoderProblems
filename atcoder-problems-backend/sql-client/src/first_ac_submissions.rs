use std::collections::{HashMap, HashSet};
use std::io::Read;

use crate::models::Submission;
use crate::PgPool;
use crate::simple_client::SimpleClient;
use anyhow::Result;
use async_trait::async_trait;
use s3_client::s3::S3Client;
use serde_json::Value;

#[async_trait]
pub trait FirstAcSubmissionUpdater {
    async fn update_first_ac_of_problems(
        &self,
        all_ac_submissions: &Vec<Submission>,
        local_json_dir: &Option<String>,
    ) -> Result<()>;
}

#[async_trait]
impl FirstAcSubmissionUpdater for PgPool {
    async fn update_first_ac_of_problems(
        &self,
        all_ac_submissions: &Vec<Submission>,
        local_json_dir: &Option<String>,  // if None, fetch from s3. Default is None.
    ) -> Result<()> {
        let all_contests_id = all_ac_submissions
            .iter()
            .map(|s| s.contest_id.clone())
            .collect::<HashSet<_>>();
        let mut contestants_for_contest = HashMap::<String, HashSet<String>>::new();
        for contest_id in all_contests_id {
            let contestants = fetch_all_contestants(&contest_id, &local_json_dir)?;
            contestants_for_contest
                .insert(contest_id, contestants.into_iter().collect::<HashSet<_>>());
        }

        let contests = self.load_contests().await?;
        let mut start_epoch_seconds_for_contest = HashMap::<String, i64>::new();
        for contest in contests {
            start_epoch_seconds_for_contest.insert(contest.id, contest.start_epoch_second);
        }

        let mut first_ac_submissions = HashMap::<String, Submission>::new(); // contest_id, submission_id
        for submission in all_ac_submissions.iter() {
            if !contestants_for_contest[&submission.contest_id].contains(&submission.user_id) {
                continue;
            }
            if submission.epoch_second < start_epoch_seconds_for_contest[&submission.contest_id] {
                continue;
            }
            if let Some(v) = first_ac_submissions.get_mut(&submission.problem_id) {
                if submission.id < v.id {
                    *v = submission.clone();
                }
            } else {
                let problem_id = submission.problem_id.clone();
                first_ac_submissions.insert(problem_id, submission.clone());
            }
        }

        for submission in first_ac_submissions.values() {
            let first_query = generate_query(submission);
            sqlx::query(&first_query).execute(self).await?;
        }
        Ok(())
    }
}

fn generate_query(submission: &Submission) -> String {
    format!(
        r"
                INSERT INTO first
                (submission_id, problem_id, contest_id) VALUES
                ({submission_id}, '{problem_id}', '{contest_id}')
                ON CONFLICT (problem_id)
                DO UPDATE SET
                        contest_id=EXCLUDED.contest_id,
                        problem_id=EXCLUDED.problem_id,
                        submission_id=EXCLUDED.submission_id;",
        submission_id = submission.id,
        problem_id = submission.problem_id,
        contest_id = submission.contest_id
    )
}

fn fetch_all_contestants(contest_id: &str, local_json_dir: &Option<String>) -> Result<Vec<String>> {
    let json_url = format!("/resource/standings/{}.json", contest_id);
    let mut standings_data_u8 = vec![];
    if let Some(dir) = local_json_dir {
        let mut file = std::fs::File::open(format!("{}/{}.json", dir, contest_id))?;
        file.read_to_end(&mut standings_data_u8)?;
    } else {
        let s3 = S3Client::new()?;
        standings_data_u8 = s3.fetch_data(&json_url);
    }
    let standings_data = String::from_utf8(standings_data_u8)?;
    let v: Value = serde_json::from_str(&standings_data)?;
    let standings = &v["StandingsData"];
    if let Value::Array(contestants) = standings {
        let mut user_names = vec![];
        for contestant in contestants {
            if let Value::String(user_name) = &contestant["UserScreenName"] {
                user_names.push(user_name.clone());
            } else {
                return Err(anyhow::anyhow!("JSON can't resolved: {}", json_url).into());
            }
        }
        Ok(user_names)
    } else {
        Err(anyhow::anyhow!("JSON can't resolved: {}", json_url).into())
    }
}
