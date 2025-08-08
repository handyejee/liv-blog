const fs = require('fs')
const globby = require('globby')
const matter = require('gray-matter')
const siteMetadata = require('../data/siteMetadata')

;(async () => {
  const pages = await globby([
    'pages/*.js',
    'pages/*.tsx',
    'data/blog/**/*.mdx',
    'data/blog/**/*.md',
    'public/tags/**/*.xml',
    '!pages/_*.js',
    '!pages/_*.tsx',
    '!pages/api',
  ])

  const urls = pages
    .map((page) => {
      // Exclude drafts from the sitemap
      if (page.search('.md') >= 1 && fs.existsSync(page)) {
        const source = fs.readFileSync(page, 'utf8')
        const fm = matter(source)
        if (fm.data.draft) {
          return null
        }
        if (fm.data.canonicalUrl) {
          return null
        }
      }
      const path = page
        .replace('pages/', '/')
        .replace('data/blog', '/blog')
        .replace('public/', '/')
        .replace('.js', '')
        .replace('.tsx', '')
        .replace('.mdx', '')
        .replace('.md', '')
        .replace('/feed.xml', '')
      const route = path === '/index' ? '' : path

      if (page.search('pages/404.') > -1 || page.search(`pages/blog/[...slug].`) > -1) {
        return null
      }
      return `  <url>
    <loc>${siteMetadata.siteUrl}${route}</loc>
  </url>`
    })
    .filter(Boolean) // null 값 제거

  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
  ].join('\n')

  fs.writeFileSync('public/sitemap.xml', sitemap)
})()
