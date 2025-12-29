import Link from '@/components/Link'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import { useState } from 'react'
import Pagination from '@/components/Pagination'
import formatDate from '@/lib/utils/formatDate'

export default function ListLayout({ posts, title, initialDisplayPosts = [], pagination }) {
  const [searchValue, setSearchValue] = useState('')
  const filteredBlogPosts = posts.filter((frontMatter) => {
    const searchContent = frontMatter.title + frontMatter.summary + frontMatter.tags.join(' ')
    return searchContent.toLowerCase().includes(searchValue.toLowerCase())
  })

  // If initialDisplayPosts exist, display it if no searchValue is specified
  const displayPosts =
    initialDisplayPosts.length > 0 && !searchValue ? initialDisplayPosts : filteredBlogPosts

  return (
    <>
      {/* Hero Banner */}
      <div className='pb-16 pt-20 text-center sm:text-left'>
        <h1 className='mb-6 text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl md:text-6xl'>
          품질과 제품의 가치를 이해하는 <br />
          개발자입니다.
        </h1>

        <p className='max-w-2xl text-lg leading-7 text-gray-600 dark:text-gray-400'>
          QA에서 개발자로, 단순히 돌아가는 기능을 만드는 것을 넘어 <br />
          제품의 완성도를 높여가는 여정을 기록합니다.
        </p>

        {/* 검색창 */}
        <div className='relative mt-12 max-w-lg'>
          <input
            aria-label='Search articles'
            type='text'
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder='관심 있는 주제를 검색해보세요'
            className='block w-full border-b-2 border-gray-200 bg-transparent py-3 focus:border-primary-500 focus:outline-none dark:border-gray-700'
          />
        </div>
      </div>

      {/* 글 목록 영역 */}
      <div className='divide-y divide-gray-200 dark:divide-gray-700'>
        <div className='space-y-2 pt-12 pb-8 md:space-y-5'>
          <h2 className='text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100'>
            최신 글
          </h2>
        </div>
        <ul>
          {!filteredBlogPosts.length && 'No posts found.'}
          {displayPosts.map((frontMatter) => {
            const { slug, date, title, summary, tags } = frontMatter
            return (
              <li key={slug} className='py-4'>
                <article className='space-y-2 xl:grid xl:grid-cols-4 xl:items-baseline xl:space-y-0'>
                  <dl>
                    <dt className='sr-only'>Published on</dt>
                    <dd className='text-base font-medium leading-6 text-gray-500 dark:text-gray-400'>
                      <time dateTime={date}>{formatDate(date)}</time>
                    </dd>
                  </dl>
                  <div className='space-y-3 xl:col-span-3'>
                    <div>
                      <h3 className='text-2xl font-bold leading-8 tracking-tight'>
                        <Link href={`/blog/${slug}`} className='text-gray-900 dark:text-gray-100'>
                          {title}
                        </Link>
                      </h3>
                      <div className='flex flex-wrap'>
                        {tags.map((tag) => (
                          <Tag key={tag} text={tag} />
                        ))}
                      </div>
                    </div>
                    <div className='prose max-w-none text-gray-500 dark:text-gray-400'>
                      {summary}
                    </div>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      </div>
      {pagination && pagination.totalPages > 1 && !searchValue && (
        <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} />
      )}
    </>
  )
}
