import Cookies from "js-cookie";

export const clear = () => Cookies.remove("token");
export const isLoggedIn = () => Cookies.get("token") !== undefined;
