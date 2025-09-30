import { DateTime } from "luxon";

export const config = {
    dir: {
        input: 'src',
        output: 'public',
    },
}

export default function(eleventyConfig) {
    eleventyConfig.addPassthroughCopy("src/style.css");
    eleventyConfig.addWatchTarget('src/style.css');
    // 記事コレクションを追加
    eleventyConfig.addCollection("posts", (collection) => {
        return collection.getFilteredByGlob("src/posts/**/*.{md,html,njk}").reverse();
    });
    // 日付フィルターを追加
    eleventyConfig.addFilter("readableDate", (dateObj) => {
        return DateTime.fromJSDate(dateObj, { zone: 'Asia/Tokyo' }).toFormat("yyyy年LL月dd日");
    });
};

