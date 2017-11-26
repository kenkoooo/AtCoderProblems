import { Problem } from "../model/Problem";
import { Contest } from "../model/Contest";

class MockRequest {
    constructor(body: any, error?: any) {
        this.body = body;
        this.error = error;
    }
    post() {
        return this;
    }
    get() {
        return this;
    }
    send() {
        return this;
    }
    query() {
        return this;
    }
    field() {
        return this;
    }
    set() {
        return this;
    }
    accept() {
        return this;
    }
    timeout() {
        return this;
    }
    body: any = null;
    error: any = null;
    end = jest.fn().mockImplementation((callback) => {
        callback(this.error, {
            status() {
                return 200;
            },
            ok() {
                return true;
            },
            get: jest.fn(),
            body: this.body,
            toError: jest.fn()
        });
    })
};

test("get and parse problems", () => {
    let response: any = [{ id: "problem-id", title: "problem title", contest_id: "contest-id" }];

    jest.mock("superagent");
    let mockAgent = require("superagent");
    mockAgent.get.mockReturnValueOnce(new MockRequest(response));
    require("./ApiCall").ApiCall
        .getProblems("")
        .then((problems: Problem[]) => {
            expect(problems).toEqual([{
                id: 'problem-id',
                title: 'problem title',
                contestId: 'contest-id'
            }]);
        });
});

test("get and parse contests", () => {
    let response: any = [{ id: "contest-id", title: "contest title", start_epoch_second: 0 }];

    jest.mock("superagent");
    let mockAgent = require("superagent");
    mockAgent.get.mockReturnValueOnce(new MockRequest(response));
    require("./ApiCall").ApiCall
        .getContests("")
        .then((contests: Contest[]) => {
            expect(contests).toEqual([{
                id: 'contest-id',
                title: 'contest title',
                start_epoch_second: 0
            }]);
        });
});
