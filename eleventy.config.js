import { DateTime } from "luxon";

export const config = {
    dir: {
        input: 'src',
        output: 'public',
    },
}

export default function (eleventyConfig) {
    eleventyConfig.addPassthroughCopy("src/style.css");
    eleventyConfig.addPassthroughCopy("src/images");
    eleventyConfig.addWatchTarget('src/style.css');

    // 記事コレクションを追加
    eleventyConfig.addCollection("posts", (collection) => {
        return collection.getFilteredByGlob("src/posts/**/*.{md,html,njk}").reverse();
    });

    // タグ一覧コレクション（posts タグは除外）
    eleventyConfig.addCollection("tagList", (collection) => {
        const tagSet = new Set();
        collection.getFilteredByGlob("src/posts/**/*.{md,html,njk}").forEach((item) => {
            if (item.data.tags) {
                item.data.tags.forEach((tag) => {
                    if (tag !== "posts") {
                        tagSet.add(tag);
                    }
                });
            }
        });
        return [...tagSet].sort();
    });

    // 月別アーカイブコレクション
    eleventyConfig.addCollection("monthlyArchive", (collection) => {
        const posts = collection.getFilteredByGlob("src/posts/**/*.{md,html,njk}");
        const archiveMap = new Map();

        posts.forEach((post) => {
            const dt = DateTime.fromJSDate(post.date, { zone: 'Asia/Tokyo' });
            const key = dt.toFormat("yyyy-LL");     // "2025-09"
            const label = dt.toFormat("yyyy年LL月"); // "2025年09月"

            if (!archiveMap.has(key)) {
                archiveMap.set(key, { key, label, posts: [] });
            }
            archiveMap.get(key).posts.push(post);
        });

        // 新しい月が先に来るようにソート
        return [...archiveMap.values()].sort((a, b) => b.key.localeCompare(a.key));
    });

    // --- フィルター ---

    // 日付フィルター
    eleventyConfig.addFilter("readableDate", (dateObj) => {
        return DateTime.fromJSDate(dateObj, { zone: 'Asia/Tokyo' }).toFormat("yyyy年LL月dd日");
    });

    // 配列の先頭 n 件を取得
    eleventyConfig.addFilter("head", (array, n) => {
        if (!Array.isArray(array)) return array;
        return array.slice(0, n);
    });

    // 年月フォーマットフィルター (Date -> "2025年09月")
    eleventyConfig.addFilter("yearMonth", (dateObj) => {
        return DateTime.fromJSDate(dateObj, { zone: 'Asia/Tokyo' }).toFormat("yyyy年LL月");
    });

    // 年月キーフィルター (Date -> "2025-09")
    eleventyConfig.addFilter("yearMonthKey", (dateObj) => {
        return DateTime.fromJSDate(dateObj, { zone: 'Asia/Tokyo' }).toFormat("yyyy-LL");
    });
};
