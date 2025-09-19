export const config = {
    dir: {
        input: 'src',
        output: 'public',
    },
}

export default function(eleventyConfig) {
    eleventyConfig.addPassthroughCopy("src/style.css");
    eleventyConfig.addWatchTarget('src/style.css');
};
