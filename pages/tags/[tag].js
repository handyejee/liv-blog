import { TagSEO } from '@/components/SEO'
import siteMetadata from '@/data/siteMetadata'
import ListLayout from '@/layouts/ListLayout'
import generateRss from '@/lib/generate-rss'
import { getAllFilesFrontMatter } from '@/lib/mdx'
import { getAllTags } from '@/lib/tags'
import kebabCase from '@/lib/utils/kebabCase'
import fs from 'fs'
import path from 'path'

const root = process.cwd()

export async function getStaticPaths() {
  const tags = await getAllTags('blog')

  return {
    paths: Object.keys(tags).map((tag) => ({
      params: {
        tag: kebabCase(tag),
      },
    })),
    fallback: false,
  }
}

export async function getStaticProps({ params }) {
  const allPosts = await getAllFilesFrontMatter('blog')
  const filteredPosts = allPosts.filter(
    (post) => post.draft !== true && post.tags.map((t) => kebabCase(t)).includes(params.tag)
  )

  // Find the original tag name to display
  const allTags = await getAllTags('blog')
  const originalTag =
    Object.keys(allTags).find((tag) => kebabCase(tag) === params.tag) || params.tag

  // rss
  if (filteredPosts.length > 0) {
    const rss = generateRss(filteredPosts, `tags/${params.tag}/feed.xml`)
    const rssPath = path.join(root, 'public', 'tags', params.tag)
    fs.mkdirSync(rssPath, { recursive: true })
    fs.writeFileSync(path.join(rssPath, 'feed.xml'), rss)
  }

  return { props: { posts: filteredPosts, tag: params.tag, originalTag } }
}

export default function Tag({ posts, tag, originalTag }) {
  // Use the original tag name for display
  const title = originalTag || tag
  return (
    <>
      <TagSEO
        title={`${originalTag || tag} - ${siteMetadata.author}`}
        description={`${originalTag || tag} tags - ${siteMetadata.author}`}
      />
      <ListLayout posts={posts} title={title} />
    </>
  )
}
