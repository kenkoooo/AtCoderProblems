use chrono::DateTime;
use scraper::{Html, Selector};

use crate::error::CrawlerError;
use crate::types::{Contest, Problem, Submission};

/// Duration for permanent contests (100 years in seconds)
const PERMANENT_CONTEST_DURATION_SECOND: i64 = 100 * 365 * 24 * 3600;

/// Parses the contest archive page and extracts contest information
///
/// # Arguments
///
/// * `html_content` - The HTML content of the contests/archive page
///
/// # Returns
///
/// A Result containing a vector of Contest structs or a CrawlerError
pub fn parse_contests_archive_html(html_content: &str) -> Result<Vec<Contest>, CrawlerError> {
    let document = Html::parse_document(html_content);

    let tbody_selector = Selector::parse("tbody")
        .map_err(|e| CrawlerError::SelectorError(e.to_string()))?;
    let tr_selector =
        Selector::parse("tr").map_err(|e| CrawlerError::SelectorError(e.to_string()))?;
    let td_selector =
        Selector::parse("td").map_err(|e| CrawlerError::SelectorError(e.to_string()))?;
    let a_selector =
        Selector::parse("a").map_err(|e| CrawlerError::SelectorError(e.to_string()))?;

    let tbody = document
        .select(&tbody_selector)
        .next()
        .ok_or_else(|| CrawlerError::ParseError("No tbody found".to_string()))?;

    let mut contests = Vec::new();
    for tr in tbody.select(&tr_selector) {
        let mut tds = tr.select(&td_selector);

        // First td: start time
        let start_td = tds
            .next()
            .ok_or_else(|| CrawlerError::ParseError("No start time td".to_string()))?;
        let start_text = start_td.text().collect::<String>();
        let start_text = start_text.trim();
        let start = DateTime::parse_from_str(start_text, "%Y-%m-%d %H:%M:%S%z")
            .map_err(|e| CrawlerError::ParseError(format!("Failed to parse date: {}", e)))?;
        let start_epoch_second = start.timestamp();

        // Second td: contest name and link
        let contest_td = tds
            .next()
            .ok_or_else(|| CrawlerError::ParseError("No contest td".to_string()))?;
        let contest_a = contest_td
            .select(&a_selector)
            .next()
            .ok_or_else(|| CrawlerError::ParseError("No contest link".to_string()))?;
        let contest_title = contest_a.text().collect::<String>();
        let contest_link = contest_a
            .value()
            .attr("href")
            .ok_or_else(|| CrawlerError::ParseError("No href".to_string()))?;
        let contest_id = contest_link
            .rsplit('/')
            .next()
            .ok_or_else(|| CrawlerError::ParseError("No contest id".to_string()))?
            .to_string();

        // Third td: duration
        let duration_td = tds
            .next()
            .ok_or_else(|| CrawlerError::ParseError("No duration td".to_string()))?;
        let duration_text = duration_td.text().collect::<String>();
        let duration_text = duration_text.trim();
        let mut parts = duration_text.split(':');
        let hours: i64 = parts
            .next()
            .ok_or_else(|| CrawlerError::ParseError("No hours".to_string()))?
            .parse()
            .map_err(|e| CrawlerError::ParseError(format!("Failed to parse hours: {}", e)))?;
        let minutes: i64 = parts
            .next()
            .ok_or_else(|| CrawlerError::ParseError("No minutes".to_string()))?
            .parse()
            .map_err(|e| CrawlerError::ParseError(format!("Failed to parse minutes: {}", e)))?;
        let duration_second = hours * 3600 + minutes * 60;

        // Fourth td: rate change
        let rate_td = tds
            .next()
            .ok_or_else(|| CrawlerError::ParseError("No rate td".to_string()))?;
        let rate_change = rate_td.text().collect::<String>().trim().to_string();

        contests.push(Contest {
            id: contest_id,
            start_epoch_second,
            duration_second,
            title: contest_title,
            rate_change,
        });
    }

    Ok(contests)
}

/// Parses the permanent contests section from the contests page
///
/// # Arguments
///
/// * `html_content` - The HTML content of the /contests/ page
///
/// # Returns
///
/// A Result containing a vector of Contest structs or a CrawlerError
pub fn parse_permanent_contests_html(html_content: &str) -> Result<Vec<Contest>, CrawlerError> {
    let document = Html::parse_document(html_content);

    let permanent_selector = Selector::parse("#contest-table-permanent")
        .map_err(|e| CrawlerError::SelectorError(e.to_string()))?;
    let tbody_selector = Selector::parse("tbody")
        .map_err(|e| CrawlerError::SelectorError(e.to_string()))?;
    let tr_selector =
        Selector::parse("tr").map_err(|e| CrawlerError::SelectorError(e.to_string()))?;
    let td_selector =
        Selector::parse("td").map_err(|e| CrawlerError::SelectorError(e.to_string()))?;
    let a_selector =
        Selector::parse("a").map_err(|e| CrawlerError::SelectorError(e.to_string()))?;

    let permanent_div = document
        .select(&permanent_selector)
        .next()
        .ok_or_else(|| CrawlerError::ParseError("No permanent contest table found".to_string()))?;

    let tbody = permanent_div
        .select(&tbody_selector)
        .next()
        .ok_or_else(|| CrawlerError::ParseError("No tbody found".to_string()))?;

    let mut contests = Vec::new();
    for tr in tbody.select(&tr_selector) {
        let mut tds = tr.select(&td_selector);

        // First td: contest name and link
        let contest_td = tds
            .next()
            .ok_or_else(|| CrawlerError::ParseError("No contest td".to_string()))?;
        let contest_a = contest_td
            .select(&a_selector)
            .next()
            .ok_or_else(|| CrawlerError::ParseError("No contest link".to_string()))?;
        let contest_title = contest_a.text().collect::<String>();
        let contest_link = contest_a
            .value()
            .attr("href")
            .ok_or_else(|| CrawlerError::ParseError("No href".to_string()))?;
        let contest_id = contest_link
            .rsplit('/')
            .next()
            .ok_or_else(|| CrawlerError::ParseError("No contest id".to_string()))?
            .to_string();

        // Second td: rate change
        let rate_td = tds
            .next()
            .ok_or_else(|| CrawlerError::ParseError("No rate td".to_string()))?;
        let rate_change = rate_td.text().collect::<String>().trim().to_string();

        contests.push(Contest {
            id: contest_id,
            start_epoch_second: 0,
            duration_second: PERMANENT_CONTEST_DURATION_SECOND,
            title: contest_title,
            rate_change,
        });
    }

    Ok(contests)
}

/// Parses the tasks.html file and extracts problem information
///
/// # Arguments
///
/// * `html_content` - The HTML content of the tasks page
/// * `contest_id` - The contest ID (e.g., "abc399")
///
/// # Returns
///
/// A Result containing a vector of Problem structs or a CrawlerError
pub fn parse_tasks_html(html_content: &str, contest_id: &str) -> Result<Vec<Problem>, CrawlerError> {
    let document = Html::parse_document(html_content);

    // Selector for the table rows containing problem information
    let row_selector = Selector::parse("table.table-bordered tbody tr")
        .map_err(|e| CrawlerError::SelectorError(e.to_string()))?;

    let mut problems = Vec::new();

    for row in document.select(&row_selector) {
        // Extract the problem index (A, B, C, etc.)
        let index_selector = Selector::parse("td.text-center.no-break a")
            .map_err(|e| CrawlerError::SelectorError(e.to_string()))?;
        let index_element = row.select(&index_selector).next();

        // Extract the problem name and URL
        let name_selector = Selector::parse("td:nth-child(2) a")
            .map_err(|e| CrawlerError::SelectorError(e.to_string()))?;
        let name_element = row.select(&name_selector).next();

        if let (Some(index_elem), Some(name_elem)) = (index_element, name_element) {
            let problem_index = index_elem.text().collect::<String>();
            let name = name_elem.text().collect::<String>();

            // Extract problem ID from URL (e.g., "/contests/abc399/tasks/abc399_a" -> "abc399_a")
            let id = if let Some(href) = name_elem.value().attr("href") {
                href.split('/').last().unwrap_or("").to_string()
            } else {
                continue; // Skip if no URL is found
            };

            problems.push(Problem {
                id,
                contest_id: contest_id.to_string(),
                problem_index,
                name,
            });
        }
    }

    Ok(problems)
}

/// Parses the submissions.html file and extracts submission information
///
/// # Arguments
///
/// * `html_content` - The HTML content of the submissions page
///
/// # Returns
///
/// A Result containing a vector of Submission structs or a CrawlerError
pub fn parse_submissions_html(html_content: &str) -> Result<Vec<Submission>, CrawlerError> {
    let document = Html::parse_document(html_content);

    // Selector for the table rows containing submission information
    let row_selector = Selector::parse("table.table-bordered tbody tr")
        .map_err(|e| CrawlerError::SelectorError(e.to_string()))?;

    let mut submissions = Vec::new();

    for row in document.select(&row_selector) {
        // Extract submission ID from the details link
        let details_selector = Selector::parse("td:last-child a.submission-details-link")
            .map_err(|e| CrawlerError::SelectorError(e.to_string()))?;
        let details_element = row.select(&details_selector).next();

        let id = if let Some(details_elem) = details_element {
            if let Some(href) = details_elem.value().attr("href") {
                // Extract ID from the URL (e.g., "/contests/abc399/submissions/64188418" -> "64188418")
                href.split('/')
                    .last()
                    .unwrap_or("")
                    .parse::<i64>()
                    .map_err(|e| {
                        CrawlerError::ParseError(format!("Failed to parse submission ID: {}", e))
                    })?
            } else {
                continue; // Skip if no URL is found
            }
        } else {
            continue; // Skip if no details link is found
        };

        // Extract submission date
        let date_selector = Selector::parse("td:first-child time")
            .map_err(|e| CrawlerError::SelectorError(e.to_string()))?;
        let date_element = row.select(&date_selector).next();

        let epoch_second = if let Some(date_elem) = date_element {
            let date_str = date_elem.text().collect::<String>();
            // Parse the date string (e.g., "2024-04-05 12:34:56+0900")
            let datetime = DateTime::parse_from_str(&date_str, "%Y-%m-%d %H:%M:%S%z")
                .map_err(|e| CrawlerError::ParseError(format!("Failed to parse date: {}", e)))?;
            datetime.timestamp()
        } else {
            continue; // Skip if no date is found
        };

        // Extract problem
        let problem_selector = Selector::parse("td:nth-child(2) a")
            .map_err(|e| CrawlerError::SelectorError(e.to_string()))?;
        let problem_element = row.select(&problem_selector).next();

        let problem = if let Some(problem_elem) = problem_element {
            // Extract problem ID from the URL (e.g., "/contests/abc399/tasks/abc399_a" -> "abc399_a")
            if let Some(href) = problem_elem.value().attr("href") {
                href.split('/').last().unwrap_or("").to_string()
            } else {
                continue; // Skip if no URL is found
            }
        } else {
            continue; // Skip if no problem is found
        };

        // Extract user
        let user_selector = Selector::parse("td:nth-child(3) a:first-child")
            .map_err(|e| CrawlerError::SelectorError(e.to_string()))?;
        let user_element = row.select(&user_selector).next();

        let user = if let Some(user_elem) = user_element {
            if let Some(href) = user_elem.value().attr("href") {
                // Extract user_id from the URL path like "/users/{user_id}"
                href.split('/')
                    .nth(2) // Get the third component after splitting (index 2)
                    .unwrap_or("")
                    .to_string()
            } else {
                continue; // Skip if no href is found
            }
        } else {
            continue; // Skip if no user is found
        };

        // Extract language
        let language_selector = Selector::parse("td:nth-child(4) a")
            .map_err(|e| CrawlerError::SelectorError(e.to_string()))?;
        let language_element = row.select(&language_selector).next();

        let language = if let Some(language_elem) = language_element {
            language_elem.text().collect::<String>()
        } else {
            continue; // Skip if no language is found
        };

        // Extract score
        let score_selector = Selector::parse("td:nth-child(5)")
            .map_err(|e| CrawlerError::SelectorError(e.to_string()))?;
        let score_element = row.select(&score_selector).next();

        let score = if let Some(score_elem) = score_element {
            score_elem
                .text()
                .collect::<String>()
                .parse::<f64>()
                .map_err(|e| CrawlerError::ParseError(format!("Failed to parse score: {}", e)))?
        } else {
            continue; // Skip if no score is found
        };

        // Extract code length
        let code_length_selector = Selector::parse("td:nth-child(6)")
            .map_err(|e| CrawlerError::SelectorError(e.to_string()))?;
        let code_length_element = row.select(&code_length_selector).next();

        let code_length = if let Some(code_length_elem) = code_length_element {
            let text = code_length_elem.text().collect::<String>();
            // Remove " Byte" from the end and parse as u32
            text.trim_end_matches(" Byte").parse().map_err(|e| {
                CrawlerError::ParseError(format!("Failed to parse code length: {}", e))
            })?
        } else {
            continue; // Skip if no code length is found
        };

        // Extract result
        let result_selector = Selector::parse("td:nth-child(7) span")
            .map_err(|e| CrawlerError::SelectorError(e.to_string()))?;
        let result_element = row.select(&result_selector).next();

        let result = if let Some(result_elem) = result_element {
            result_elem.text().collect::<String>()
        } else {
            continue; // Skip if no result is found
        };

        // Extract execution time
        let execution_time_selector = Selector::parse("td:nth-child(8)")
            .map_err(|e| CrawlerError::SelectorError(e.to_string()))?;
        let execution_time_element = row.select(&execution_time_selector).next();

        let execution_time = execution_time_element.and_then(|e| {
            let text = e.text().collect::<String>();
            text.trim_end_matches(" ms").parse::<i32>().ok()
        });

        // Get the URL from the details link
        let url = if let Some(details_elem) = details_element {
            if let Some(href) = details_elem.value().attr("href") {
                href.to_string()
            } else {
                continue; // Skip if no URL is found
            }
        } else {
            continue; // Skip if no details link is found
        };

        // Extract contest ID from the URL (e.g., "/contests/abc399/submissions/64188418" -> "abc399")
        let contest_id = url
            .split('/')
            .nth(2) // Get the third component after splitting
            .unwrap_or("")
            .to_string();

        submissions.push(Submission {
            id,
            epoch_second,
            problem_id: problem,
            contest_id,
            user,
            language,
            score,
            code_length,
            result,
            execution_time,
        });
    }

    Ok(submissions)
}
