import { isSubmission } from "../interfaces/Submission";

const ATCODER_API_URL = process.env.REACT_APP_ATCODER_API_URL;

export const fetchRecentSubmissions = () => {
  return fetch(`${ATCODER_API_URL}/v3/recent`)
    .then(r => r.json())
    .then((r: any[]) => r.filter(isSubmission));
};
