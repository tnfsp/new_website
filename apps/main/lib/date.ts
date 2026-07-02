/**
 * 站方時區（Asia/Taipei）的日期工具。
 *
 * 文章的 publishedAt、每日瀏覽統計、排程發布判斷都以台北日期為準；
 * 直接用 `new Date().toISOString()` 會拿到 UTC 日期，
 * 台灣時間早上 8 點前會差一天。
 */
const TAIPEI_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Taipei",
}); // en-CA → YYYY-MM-DD

export function todayInTaipei(): string {
  return TAIPEI_DATE.format(new Date());
}

export function dateInTaipei(date: Date): string {
  return TAIPEI_DATE.format(date);
}
