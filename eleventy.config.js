import { DateTime } from "luxon";
import pluginRss from "@11ty/eleventy-plugin-rss";
import Image from "@11ty/eleventy-img"
import path from "path"

export const config = {
    dir: {
        input: 'src',
        output: 'public',
    },
}

function parseImageOptions(sizesOrWidth = "100vw", displayWidth = "") {
    const widthTokenPattern = /^\d+(?:\.\d+)?(?:%|px|rem|em|vw|vh)$/;

    if (displayWidth) {
        return {
            sizes: sizesOrWidth || "100vw",
            displayWidth,
        };
    }

    if (typeof sizesOrWidth === "string" && widthTokenPattern.test(sizesOrWidth.trim())) {
        return {
            sizes: "100vw",
            displayWidth: sizesOrWidth.trim(),
        };
    }

    return {
        sizes: sizesOrWidth || "100vw",
        displayWidth: "",
    };
}

async function imageShortcode(src, alt, sizesOrWidth = "100vw", displayWidth = "") {
    const { sizes, displayWidth: resolvedDisplayWidth } = parseImageOptions(sizesOrWidth, displayWidth);

    // 記事のフォルダにある画像を探すためのパス調整
    // srcが "./local-image.jpg" のような相対パスの場合に対応
    let fullSrc = src;
    if (!src.startsWith("http")) {
        fullSrc = path.join(path.dirname(this.page.inputPath), src);
    }

    let metadata = await Image(fullSrc, {
        widths: [300, 600, 1200],
        formats: ["avif", "webp", "jpeg"],
        outputDir: "./public/img/",
        urlPath: "/img/",
    });

    let imageAttributes = {
        alt,
        sizes,
        loading: "lazy",
        decoding: "async",
    };

    const html = Image.generateHTML(metadata, imageAttributes);

    if (!resolvedDisplayWidth) {
        return html;
    }

    return html.replace("<picture>", `<picture style="width:${resolvedDisplayWidth};">`);
}

export default function (eleventyConfig) {
    // プラグイン
    eleventyConfig.addPlugin(pluginRss);

    eleventyConfig.addPassthroughCopy("src/style.css");
    eleventyConfig.addPassthroughCopy("src/images");
    eleventyConfig.addPassthroughCopy("src/robots.txt");
    eleventyConfig.addPassthroughCopy("src/posts/**/*.{jpg,png,gif,svg}");
    eleventyConfig.addWatchTarget('src/style.css');
    eleventyConfig.addWatchTarget('src/posts/**/*');

    eleventyConfig.addNunjucksAsyncShortcode("image", imageShortcode);
    eleventyConfig.addLiquidShortcode("image", imageShortcode);

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

    // ISO 8601 日付フィルター
    eleventyConfig.addFilter("isoDate", (dateObj) => {
        return DateTime.fromJSDate(dateObj, { zone: 'Asia/Tokyo' }).toISO();
    });

    // 先頭スラッシュ除去フィルター（URL結合用）
    eleventyConfig.addFilter("removeLeadingSlash", (str) => {
        if (typeof str !== "string") return str;
        return str.replace(/^\//, "");
    });

    return config
};
