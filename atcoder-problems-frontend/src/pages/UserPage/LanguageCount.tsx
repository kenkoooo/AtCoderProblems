import React from 'react';
import { Row, Col } from 'reactstrap';
import Submission from '../../interfaces/Submission';
import { isAccepted } from '../../utils';

const LanguageCount = ({ submissions }: { submissions: Submission[] }) => {
	const language_map = submissions.filter((s) => isAccepted(s.result)).reduce((map, submission) => {
		const language = submission.language.replace(/\d* \(.*\)$/, '');
		const problems = map.get(language);
		if (problems) {
			problems.add(submission.problem_id);
		} else {
			map.set(language, new Set([submission.problem_id]));
		}
		return map;
	}, new Map<string, Set<string>>());
	const language_count = Array.from(language_map)
		.map(([ language, set ]) => ({ language, count: set.size }))
		.sort((a, b) => a.language.localeCompare(b.language));
	return (
		<Row>
			{language_count.map(({ language, count }) => (
				<Col key={language} className="text-center col-sm-3 my-3">
					<h3>{language}</h3>
					<h5 className="text-muted">{count} AC</h5>
				</Col>
			))}
		</Row>
	);
};

export default LanguageCount;
