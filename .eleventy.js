const { DateTime } = require("luxon");

const markdownIt = require("markdown-it");
const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const { EleventyRenderPlugin } = require("@11ty/eleventy");

module.exports = function(eleventyConfig) {

  eleventyConfig.addPlugin(EleventyRenderPlugin);

  const md = new markdownIt({
    html: true,
    breaks: true,
    linkify: true
  })
  .use(require('markdown-it-anchor'))
  .use(require('markdown-it-footnote'))
  .use(require('markdown-it-emoji'),[])
  .disable("code");

  eleventyConfig.setLibrary("md", md);

  // https://github.com/11ty/eleventy/issues/658
  eleventyConfig.addPairedShortcode("markdown", (content) => {
    return md.render(content);
  });

  eleventyConfig.addPlugin(pluginSyntaxHighlight);

  eleventyConfig.addWatchTarget('src/style.css')
  eleventyConfig.addPassthroughCopy({ 'src/style.css': 'style.css' })
  eleventyConfig.addPassthroughCopy({ 'src/CNAME': 'CNAME' })
  //eleventyConfig.addPassthroughCopy({ 'node_modules/the-new-css-reset/css/reset.css': 'reset.css' })
  eleventyConfig.addPassthroughCopy({ 'node_modules/@picocss/pico/css/pico.min.css': 'pico.css' })

  eleventyConfig.addFilter('log', value => {
    console.log(value)
  })

		// Filters
   eleventyConfig.addFilter("readableDate", (dateObj, format, zone) => {
   	// Formatting tokens for Luxon: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
   	return DateTime.fromJSDate(dateObj, { zone: zone || "utc" }).toFormat(format || "dd LLLL yyyy");
   });
   
   eleventyConfig.addFilter('htmlDateString', (dateObj) => {
   	// dateObj input: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
   	return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat('yyyy-LL-dd');
   });

  // ONLY publish DONE articles 
  eleventyConfig.addCollection("production_posts", function(collectionApi) {
    // For the final build we skip WIP posts
    if (process.env.ELEVENTY_ENV == "production"){
      return collectionApi.getFilteredByTags("posts", "public");
    }
    return collectionApi.getFilteredByTags("posts"); 
  });

  eleventyConfig.addPlugin(
    require("eleventy-plugin-ignore"),
    {
      // template ignored if function returns true
      ignore: (data) => process.env.ELEVENTY_ENV === "production" && !(data.tags?.includes('public')) ,
      // check all templates ending with these extensions
      templateFormats: ["md"]
    }
  );

  return {
    markdownTemplateEngine: "njk",
    dir: {
      input: "src",
      output: "dist"
    }
  }
}
