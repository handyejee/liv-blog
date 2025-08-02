import Head from 'next/head'
import { useRouter } from 'next/router'
import siteMetadata from '@/data/siteMetadata'

const CommonSEO = ({
  title,
  description,
  ogType,
  ogImage,
  twImage,
  canonicalUrl,
  publishedTime,
  modifiedTime,
  tags = [],
}) => {
  const router = useRouter()
  const fullUrl = `${siteMetadata.siteUrl}${router.asPath}`

  return (
    <Head>
      {/* 기본 메타 태그 */}
      <title>{title}</title>
      <meta name='description' content={description} />
      <meta name='robots' content='follow, index' />
      <meta name='viewport' content='width=device-width, initial-scale=1' />

      {/* 언어 및 지역 */}
      <meta name='language' content={siteMetadata.language || 'en'} />
      <html lang={siteMetadata.language || 'en'} />

      {/* Open Graph */}
      <meta property='og:url' content={fullUrl} />
      <meta property='og:type' content={ogType} />
      <meta property='og:site_name' content={siteMetadata.title} />
      <meta property='og:description' content={description} />
      <meta property='og:title' content={title} />
      <meta property='og:locale' content={siteMetadata.locale || 'en_US'} />

      {/* 이미지 처리 개선 */}
      {Array.isArray(ogImage) ? (
        ogImage.map(({ url }, index) => <meta property='og:image' content={url} key={index} />)
      ) : (
        <meta property='og:image' content={ogImage} />
      )}

      {/* Twitter Card - 선택사항 */}
      {siteMetadata.twitter && (
        <>
          <meta name='twitter:card' content='summary_large_image' />
          <meta name='twitter:site' content={siteMetadata.twitter} />
          <meta name='twitter:creator' content={siteMetadata.twitter} />
          <meta name='twitter:title' content={title} />
          <meta name='twitter:description' content={description} />
          <meta name='twitter:image' content={twImage} />
        </>
      )}

      {/* Article 관련 메타태그 */}
      {publishedTime && <meta property='article:published_time' content={publishedTime} />}
      {modifiedTime && <meta property='article:modified_time' content={modifiedTime} />}
      {siteMetadata.author && <meta property='article:author' content={siteMetadata.author} />}

      {/* 태그들 */}
      {tags.map((tag, index) => (
        <meta property='article:tag' content={tag} key={index} />
      ))}

      {/* Canonical URL */}
      <link rel='canonical' href={canonicalUrl ? canonicalUrl : fullUrl} />

      {/* 추가 SEO 메타태그 */}
      <meta name='author' content={siteMetadata.author} />
      <meta name='publisher' content={siteMetadata.author} />

      {/* 구조화된 데이터를 위한 JSON-LD */}
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: siteMetadata.title,
            url: siteMetadata.siteUrl,
            description: siteMetadata.description,
            author: {
              '@type': 'Person',
              name: siteMetadata.author,
            },
          }),
        }}
      />
    </Head>
  )
}

export const PageSEO = ({ title, description, url }) => {
  const ogImageUrl = siteMetadata.siteUrl + siteMetadata.socialBanner

  return (
    <CommonSEO
      title={title}
      description={description}
      ogType='website'
      ogImage={ogImageUrl}
      twImage={siteMetadata.twitter ? ogImageUrl : null}
      canonicalUrl={url}
    />
  )
}

export const BlogSEO = ({
  authorDetails,
  title,
  summary,
  date,
  lastmod,
  url,
  images = [],
  canonicalUrl,
  tags = [],
}) => {
  const publishedAt = new Date(date).toISOString()
  const modifiedAt = new Date(lastmod || date).toISOString()

  let imagesArr =
    images.length === 0
      ? [siteMetadata.socialBanner]
      : typeof images === 'string'
      ? [images]
      : images

  const featuredImages = imagesArr.map((img) => ({
    '@type': 'ImageObject',
    url: img.includes('http') ? img : siteMetadata.siteUrl + img,
  }))

  const authorList = authorDetails
    ? authorDetails.map((author) => ({
        '@type': 'Person',
        name: author.name,
      }))
    : [
        {
          '@type': 'Person',
          name: siteMetadata.author,
        },
      ]

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    headline: title,
    description: summary,
    image: featuredImages,
    datePublished: publishedAt,
    dateModified: modifiedAt,
    author: authorList,
    publisher: {
      '@type': 'Organization',
      name: siteMetadata.author,
      logo: {
        '@type': 'ImageObject',
        url: `${siteMetadata.siteUrl}${siteMetadata.siteLogo}`,
      },
    },
    keywords: tags.join(', '),
  }

  const twImageUrl = siteMetadata.twitter ? featuredImages[0].url : null

  return (
    <>
      <CommonSEO
        title={title}
        description={summary}
        ogType='article'
        ogImage={featuredImages}
        twImage={twImageUrl}
        canonicalUrl={canonicalUrl}
        publishedTime={publishedAt}
        modifiedTime={modifiedAt}
        tags={tags}
      />
      <Head>
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData, null, 2),
          }}
        />
      </Head>
    </>
  )
}
