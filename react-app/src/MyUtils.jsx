import request from 'superagent';

class MyUtils {
  static getAPIPromise(url, query) {
    return new Promise((resolve, reject) => {
      request.get(url).query(query).end((err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(JSON.parse(res.text));
        }
      });
    });
  }
}

export default MyUtils;
