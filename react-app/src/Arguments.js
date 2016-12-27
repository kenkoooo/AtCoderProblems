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

        this.ranking = args.ranking;
        this.kind = args.kind;
        if (this.kind == null) this.kind = "index";
        if (args.list != null && args.list === 0) this.kind = "index";
        if (args.list != null && args.list === 1) this.kind = "list";
        if (args.list != null && args.list === 2) this.kind = "battle";
        if (args.list != null && args.list === 3) this.kind = "practice";

        this.trying = args.trying != null;
    }

    isRanking() {
        return this.ranking != null;
    }
    isUserPage() {
        return this.kind === "user";
    }
    isIndex() {
        return this.kind === "index" && !this.isRanking();
    }
    isList() {
        return this.kind === "list";
    }
    isBattle() {
        return this.kind === "battle";
    }
    isPractice() {
        return this.kind === "practice";
    }
}

export default Arguments;
