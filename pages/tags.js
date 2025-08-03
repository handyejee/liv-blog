import Link from '@/components/Link'
import { PageSEO } from '@/components/SEO'
import siteMetadata from '@/data/siteMetadata'
import { getAllTags } from '@/lib/tags'
import { getAllFilesFrontMatter } from '@/lib/mdx'
import kebabCase from '@/lib/utils/kebabCase'
import formatDate from '@/lib/utils/formatDate'

export async function getStaticProps() {
  const tags = await getAllTags('blog')
  const posts = await getAllFilesFrontMatter('blog')

  return { props: { tags, posts } }
}

export default function Tags({ tags, posts }) {
  const sortedTags = Object.keys(tags).sort((a, b) => tags[b] - tags[a])

  // 각 태그별 포스트들 가져오기
  const getPostsByTag = (tag) => {
    return posts
      .filter((post) => post.draft !== true && post.tags?.includes(tag))
      .sort((a, b) => new Date(b.date) - new Date(a.date)) // 최신순 정렬
  }

  return (
    <>
      <PageSEO title={`Tags - ${siteMetadata.author}`} description='Things I blog about' />

      <div className='divide-y divide-gray-200 dark:divide-gray-700'>
        {/* 헤더 */}
        <div className='space-y-2 pt-6 pb-8 md:space-y-5'>
          <h1 className='text-3xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14'>
            태그 검색
          </h1>
          <p className='text-lg leading-7 text-gray-500 dark:text-gray-400'>
            태그별로 정리된 모든 포스트를 확인하세요
          </p>
        </div>

        {/* 태그 버튼들 - 빠른 이동용 */}
        <div className='pt-8 pb-6'>
          <div className='flex flex-wrap gap-2'>
            {sortedTags.map((tag) => (
              <Link
                key={tag}
                href={`#${kebabCase(tag)}`}
                className='inline-flex items-center rounded-full bg-primary-100 px-3 py-1.5 text-sm font-medium text-primary-700 transition-colors duration-200 hover:bg-primary-200 dark:bg-primary-900 dark:text-primary-300 dark:hover:bg-primary-800'>
                {tag}
                <span className='ml-1.5 rounded-full bg-primary-200 px-1.5 py-0.5 text-xs dark:bg-primary-800'>
                  {tags[tag]}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* 각 태그별 포스트 목록 */}
        <div className='pt-8'>
          <div className='space-y-12'>
            {sortedTags.map((tag) => {
              const tagPosts = getPostsByTag(tag)

              return (
                <section key={tag} id={kebabCase(tag)} className='scroll-mt-24'>
                  {/* 태그 헤더 */}
                  <div className='mb-6 flex items-center justify-between'>
                    <h2 className='border-b-2 border-primary-500 pb-1 text-2xl font-bold text-gray-900 dark:text-gray-100'>
                      {tag} ({tags[tag]})
                    </h2>
                    <Link
                      href={`/tags/${kebabCase(tag)}`}
                      className='text-sm font-medium text-primary-500 hover:text-primary-600 dark:hover:text-primary-400'>
                      개별 페이지로 보기 →
                    </Link>
                  </div>

                  <div className='space-y-3'>
                    {tagPosts.map((post) => (
                      <article key={post.slug} className='group'>
                        <div className='flex items-center space-x-3 rounded-md py-2 transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'>
                          {/* 포인트 아이콘 */}
                          <div className='flex-shrink-0'>
                            <div className='h-1.5 w-1.5 rounded-full bg-primary-500'></div>
                          </div>

                          {/* 포스트 제목 */}
                          <div className='min-w-0 flex-1'>
                            <Link
                              href={`/blog/${post.slug}`}
                              className='font-medium text-gray-900 transition-colors hover:text-primary-500 dark:text-gray-100 dark:hover:text-primary-400'>
                              {post.title}
                            </Link>
                          </div>

                          {/* 날짜 */}
                          <div className='flex-shrink-0'>
                            <time
                              dateTime={post.date}
                              className='text-sm text-gray-500 dark:text-gray-400'>
                              {formatDate(post.date)}
                            </time>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
