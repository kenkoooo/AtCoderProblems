export class MockRequest {
  constructor(body: any, error?: any) {
    this.body = body;
    this.error = error;
  }
  get() {
    return this;
  }
  set() {
    return this;
  }
  query() {
    return this;
  }
  body: any = null;
  error: any = null;
  end = jest.fn().mockImplementation(callback => {
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
  });
}
