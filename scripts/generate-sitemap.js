const fs = require('fs')
const globby = require('globby')
const matter = require('gray-matter')
const siteMetadata = require('../data/siteMetadata')

// Manually get tags since we're using CommonJS
async function getAllTags() {
  const files = await globby(['data/blog/**/*.mdx', 'data/blog/**/*.md'])
  let tagCount = {}
  
  files.forEach((file) => {
    const source = fs.readFileSync(file, 'utf8')
    const { data } = matter(source)
    if (data.tags && data.draft !== true) {
      data.tags.forEach((tag) => {
        if (tag in tagCount) {
          tagCount[tag] += 1
        } else {
          tagCount[tag] = 1
        }
      })
    }
  })
  
  return tagCount
}

// Simple kebab-case function
function kebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

function formatDate(date) {
  return new Date(date).toISOString()
}

;(async () => {
  // Get all static pages
  const pages = await globby([
    'pages/*.js',
    'pages/*.tsx',
    '!pages/_*.js',
    '!pages/_*.tsx',
    '!pages/api',
    '!pages/404.js',
    '!pages/blog/[...slug].js',
    '!pages/tags/[tag].js',
  ])

  // Get all blog posts
  const posts = await globby(['data/blog/**/*.mdx', 'data/blog/**/*.md'])

  // Get all tags (converted to kebab-case for URLs)
  const allTags = await getAllTags()
  const tagPages = Object.keys(allTags).map((tag) => kebabCase(tag))

  const staticUrls = pages
    .map((page) => {
      const path = page
        .replace('pages/', '/')
        .replace('.js', '')
        .replace('.tsx', '')
      const route = path === '/index' ? '' : path

      return `  <url>
    <loc>${siteMetadata.siteUrl}${route}</loc>
    <lastmod>${formatDate(new Date())}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    })

  const postUrls = posts
    .map((post) => {
      const source = fs.readFileSync(post, 'utf8')
      const fm = matter(source)
      
      // Skip drafts and canonical URLs
      if (fm.data.draft || fm.data.canonicalUrl) {
        return null
      }

      const slug = post
        .replace('data/blog/', '')
        .replace('.mdx', '')
        .replace('.md', '')

      const lastmod = fm.data.lastmod || fm.data.date
      
      return `  <url>
    <loc>${siteMetadata.siteUrl}/blog/${slug}</loc>
    <lastmod>${formatDate(lastmod)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>`
    })
    .filter(Boolean)

  const tagUrls = [...new Set(tagPages)] // 중복 제거
    .map((tag) => {
      return `  <url>
    <loc>${siteMetadata.siteUrl}/tags/${encodeURIComponent(tag)}</loc>
    <lastmod>${formatDate(new Date())}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
    })

  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...staticUrls,
    ...postUrls,
    ...tagUrls,
    '</urlset>',
  ].join('\n')

  fs.writeFileSync('public/sitemap.xml', sitemap)
  console.log(`Generated sitemap with ${staticUrls.length + postUrls.length + tagUrls.length} URLs`)
})()
