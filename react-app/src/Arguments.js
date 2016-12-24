import queryString from 'query-string';

class Arguments {
  constructor() {
    const args = queryString.parse(location.search);
    this.name = args.name;
    if (this.name == null)
      this.name = "";

    const rivals_string = args.rivals;
    if (rivals_string != null && rivals_string !== "")
      this.rivals = rivals_string.split(",");
    else
      this.rivals = [];

    this.list = args.list;
    this.ranking = args.ranking;
    this.kind = args.kind;
  }
}

export default Arguments;
