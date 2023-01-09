const markdownIt = require("markdown-it");
const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const pluginTOC = require('eleventy-plugin-toc')
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

  eleventyConfig.addPlugin(pluginTOC)
  eleventyConfig.addPlugin(pluginSyntaxHighlight);

  eleventyConfig.addWatchTarget('src/style.css')
  eleventyConfig.addPassthroughCopy({ 'src/style.css': 'style.css' })
  eleventyConfig.addPassthroughCopy({ 'node_modules/the-new-css-reset/css/reset.css': 'reset.css' })

  

  return {
    markdownTemplateEngine: "njk",
    dir: {
      input: "src",
      output: "dist"
    }
  }
}
