import * as React from "react";
import { Table, Grid } from "react-bootstrap";
import { } from "react-bootstrap";
import { CategoryOneBlock } from "./CategoryOneBlock"
import { Problem } from "../model/Problem";
import { Contest } from "../model/Contest";

export interface CategoryProps {
    problems: Array<Problem>;
    contests: Array<Contest>;
    userId: string;
    rivals: Array<String>;
}

export class Category extends React.Component<CategoryProps, {}>{

    render() {
        let problemMap = new Map<string, Array<Problem>>();
        this.props.contests.forEach(contest => {
            problemMap.set(contest.id, []);
        });


        this.props.problems.forEach((problem) => {
            if (problemMap.has(problem.contestId)) {
                problemMap.get(problem.contestId).push(problem);
            }
        });

        let header = ['a', 'b', 'c', 'd', 'e', 'f'];

        let data = this.props.contests
            .filter(contest => contest.id.match(/^agc\d{3}$/))
            .sort((a, b) => a.id.localeCompare(b.id))
            .reverse()
            .filter(contest => problemMap.has(contest.id))
            .map(contest => {
                let problems = problemMap.get(contest.id).sort((a, b) => a.id.localeCompare(b.id));
                let r: [Contest, Array<Problem>] = [contest, problems];
                return r;
            });
        console.log(data);
        console.log(this.props.contests);
        return (
            <Grid>
                <CategoryOneBlock categoryTitle="AtCoder B" data={data} header={header}></CategoryOneBlock>
            </Grid>
        );
    }
}