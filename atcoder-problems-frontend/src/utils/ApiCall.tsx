import * as request from 'superagent';

export class ApiCall {
    static getJson(url: string): Promise<any> {
        return new Promise(
            (resolve, reject) => {
                request
                    .get(url)
                    .set('Content-Type', 'application/json')
                    .end((err, res) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(res.body);
                        }
                    });
            });
    }
}
