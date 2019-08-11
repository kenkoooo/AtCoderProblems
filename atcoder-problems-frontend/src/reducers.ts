import State from "./interfaces/State";
import { List } from "immutable";

const initialState: State = {
  userId: "",
  rivals: List(),
  contests: List(),
  problems: List(),
  mergedProblems: List(),
  submissions: List(),
  userInfo: undefined
};

const rootReducer = (state: State = initialState) => {
  return state;
};

export default rootReducer;
