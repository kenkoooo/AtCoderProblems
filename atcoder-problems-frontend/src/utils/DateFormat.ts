export function formatDate(epoch_second: number) {
	const date = new Date(epoch_second * 1000);
	const year = date.getFullYear();
	const month = date.getMonth() + 1;
	const day = date.getDate();
	const month_str = month < 10 ? '0' + month : month;
	const day_str = day < 10 ? '0' + day : day;
	return year + '-' + month_str + '-' + day_str;
}
