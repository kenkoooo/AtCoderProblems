import Submission, { isSubmission } from "../interfaces/Submission";

const ATCODER_API_URL = process.env.REACT_APP_ATCODER_API_URL;

export const fetchRecentSubmissions = (): Promise<Submission[]> => {
  return (
    fetch(`${ATCODER_API_URL}/v3/recent`)
      .then((r) => r.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((r: any[]) => r.filter(isSubmission))
  );
};

export const fetchUserSubmissions = (user: string): Promise<Submission[]> =>
  user.length > 0
    ? fetch(`${ATCODER_API_URL}/results?user=${user}`)
        .then((r) => r.json())
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((r: any[]) => r.filter(isSubmission))
    : Promise.resolve([]);
