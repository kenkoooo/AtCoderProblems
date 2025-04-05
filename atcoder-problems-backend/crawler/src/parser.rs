use scraper::{Html, Selector};

use crate::error::CrawlerError;
use crate::types::{Problem, Submission};

/// Parses the tasks.html file and extracts problem information
///
/// # Arguments
///
/// * `html_content` - The HTML content of the tasks page
///
/// # Returns
///
/// A Result containing a vector of Problem structs or a CrawlerError
pub fn parse_tasks_html(html_content: &str) -> Result<Vec<Problem>, CrawlerError> {
    let document = Html::parse_document(html_content);

    // Selector for the table rows containing problem information
    let row_selector = Selector::parse("table.table-bordered tbody tr")
        .map_err(|e| CrawlerError::SelectorError(e.to_string()))?;

    let mut problems = Vec::new();

    for row in document.select(&row_selector) {
        // Extract the problem prefix (A, B, C, etc.)
        let prefix_selector = Selector::parse("td.text-center.no-break a")
            .map_err(|e| CrawlerError::SelectorError(e.to_string()))?;
        let prefix_element = row.select(&prefix_selector).next();

        // Extract the problem name and URL
        let name_selector = Selector::parse("td:nth-child(2) a")
            .map_err(|e| CrawlerError::SelectorError(e.to_string()))?;
        let name_element = row.select(&name_selector).next();

        if let (Some(prefix_elem), Some(name_elem)) = (prefix_element, name_element) {
            let prefix = prefix_elem.text().collect::<String>();
            let name = name_elem.text().collect::<String>();

            // Get the URL from the href attribute
            let url = if let Some(href) = name_elem.value().attr("href") {
                // Return the relative URL as is
                href.to_string()
            } else {
                continue; // Skip if no URL is found
            };

            problems.push(Problem { prefix, name, url });
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
                href.split('/').last().unwrap_or("").to_string()
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

        let date = if let Some(date_elem) = date_element {
            date_elem.text().collect::<String>()
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
            user_elem.text().collect::<String>()
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
            score_elem.text().collect::<String>()
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
            text.trim_end_matches(" Byte").parse::<u32>().map_err(|e| {
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

        let execution_time = if let Some(execution_time_elem) = execution_time_element {
            execution_time_elem.text().collect::<String>()
        } else {
            continue; // Skip if no execution time is found
        };

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
            date,
            problem_id: problem,
            contest_id,
            user,
            language,
            score,
            code_length,
            result,
            execution_time,
            url,
        });
    }

    Ok(submissions)
}
