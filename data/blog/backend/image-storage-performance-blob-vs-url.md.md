---
title: 이미지 저장 방식: DB BLOB보다 URL 링크를 선호하는 이유는 뭘까?
date: '2025-12-20'
tags: ['Backend', 'Java', 'SpringDataJPA', 'Performance', 'OOM', 'BLOB', '이미지저장']
draft: false
summary: 데이터베이스에 이미지 파일을 직접 저장할 경우 위험할 수 있는 이유를 성능 테스트와 OOM(Out Of Memory) 분석을 통해 알아봅니다. 
---
[마음메이트](https://maummate.com/) 서비스에서 이미지 기능을 개발하면서 이미지 저장방식에 대해서 고민한 부분을 나눠보려고 합니다.

### 요구사항

서비스에서 상담사 목록과 상세 페이지에서 상담사가 등록한 이미지가 노출된다는 요구사항이 있습니다. 추후 자격증 업로드 같이 파일로도 확장 가능성이 있습니다.

### 분석

이미지를 어떻게 저장해야 하지? 라고 생각할때 먼저 들었던 방식은 이미지 URL을 저장하는 방식입니다.

먼저 이미지를 링크로 저장하는 방식은 흔하게 찾아볼 수 있는 방식입니다. 예시로 인프런 홈페이지에서 [모든 웹 개발자가 봐야 할 단 한 장의 지도](https://www.inflearn.com/course/%EB%AA%A8%EB%93%A0-%EC%9B%B9-%EA%B0%9C%EB%B0%9C%EC%9E%90%EA%B0%80-%EB%B4%90%EC%95%BC-%ED%95%A0-%EB%8B%A8-%ED%95%9C-%EC%9E%A5) 강의소개에 있는 이미지를 클릭해보면 `cdn.inflearn.com`으로 시작되는 이미지가 링크로 되어있습니다.

### 가설

이미지를 URL로 저장하는 방식이 파일을 직접 데이터베이스에 저장하는 방식보다 저장된 데이터를 가져오는 속도가 더 빠를 것이라고 예측을 하고 조회에 소요되는 시간을 측정해보기로 했습니다.

가설을 검증하기 위해 1MB 크기의 이미지 100개를 DB에 직접 저장하는 방식과 클라우드에 저장 후 URL로 저장하는 방식의 조회 성능을 비교하는 테스트를 설계했습니다. 테스트는 JUnit에서 테스트코드로 수행했습니다.

### 테스트 환경

- **Framework**: Spring Boot 3.9, Spring Data JPA
- **DB**: H2 In-Memory Database
- **Test Tool**: `TestEntityManager` (영속성 컨텍스트 제어 및 실제 DB I/O 측정을 위해 사용)

### 실험방법

1. 스프링부트 프로젝트를 생성합니다.
의존성은 SpringWeb과 Spring Data JPA, H2 Database를 추가합니다.

    ```java
    dependencies {
        implementation 'org.springframework.boot:spring-boot-h2console'
        implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
        implementation 'org.springframework.boot:spring-boot-starter-webmvc'
        runtimeOnly 'com.h2database:h2'
        testImplementation 'org.springframework.boot:spring-boot-starter-data-jpa-test'
        testImplementation 'org.springframework.boot:spring-boot-starter-webmvc-test'
        testRuntimeOnly 'org.junit.platform:junit-platform-launcher'
    }
    ```

2. Blob 타입의 이미지를 저장하기 위한 `ImageBlob` 엔티티와 URL을 String 타입으로 저장하는 `ImageUrl` 엔티티를 생성합니다. 

JPA 엔티티는 프록시 객체를 생성하기 위해 기본 생성자가 필요합니다. 추가적으로 테스트코드에서 데이터를 주입하기 위해 매개변수를 가진 생성자를 함께 선언했습니다. Lombok을 사용한다면 `@NoArgsConstructor` 과 `@AllArgsConstructor` 어노테이션을 사용할 수 있습니다.

```java
@Entity
public class ImageBlob {
    @Id
    @GeneratedValue
    private Long id;

    @Lob
    private byte[] data;

    protected ImageBlob() {}

    public ImageBlob(byte[] data) {
        this.data = data;
    }
}
```

```java
@Entity
public class ImageUrl {
    @Id
    @GeneratedValue
    private Long id;

    private String url;

    protected ImageUrl() {}

    public ImageUrl(String url) {
        this.url = url;
    }
}
```

3.테스트 코드를 작성합니다
JPA의 `EntityManager`을 직접 주입받아서 사용합니다. Repository를 사용해 `save()`를 통해 저장하게 되면 데이터가 영속성 컨텍스트에 먼저 저장됩니다. 이후에 조회하게 되는 값은 데이터베이스가 아닌 메모리에 저장된 값으로 조회하게 되어 데이터베이스에 조회 속도를 측정하려고 하는 목적에 벗어날 수 있게 됩니다. `EntityManager` 을 직접 사용하게 되면 저장(persist) 이후 `clear()`메서드를 사용해 메모리에 있는 이미지를 삭제할 수 있습니다.

*Given*

- 1MB이미지 데이터 100개를 생성해 순차적으로 데이터베이스에 삽입합니다.  여기서 JPA의 1차 캐시에서 데이터를 가져오는 영향을 배제하기 위해 `flush()` 와 `clear()` 을 호출해 영속성 컨텍스트를 비워줍니다.

*When*

- 측정 시작 기간을 측정합니다(`System.currentTimeMillis()`)
- `System.currentTimeMillis()`를 사용해 측정 시작 시간을 기록하고 JPQL을 통해 DB에 저장된 100개의 데이터를 한 번에 리스트로 조회합니다.

*Then*

- 조회가 완료된 후 종료시간과 시작시간 차이를 계산해 데이터베이스에서 바이너리 데이터를 읽어올 때 발생하는 소요 시간을 출력합니다.

### 실험결과

테스트코드를 수행해보면 상반된 결과를 확인할 수 있습니다.

1. Blob 타입으로 저장한 이미지 목록을 조회하는 경우

Blob 타입으로 저장한 바이너리 이미지 목록을 조회하면 OOM(Out Of Memory) 에러가 발생합니다. 테스트 설계에서 파일의 크기는 각 1MB 였습니다. 목록조회로 호출할 경우 최소 `1MB × 100개의 이미지 = 100MB` 가 호출됩니다. 저장된 바이너리 데이터가 자바 객체로 변환되는 과정에서 2-3배의 데이터가 더 필요하게 됩니다. 이러한 이유로 JVM에 할당된 Heap Memory가 감당하지 못하고 OOM 에러를 발생시키게 된 것입니다.

<img width="460" height="300" src="/static/images/project/blob_result_oom.png"/>

2. String 타입으로 저장한 이미지 URL 목록을 조회하는 경우

반면 URL 주소 문자열은 사이즈가 작습니다. 임의의 URL로 생성해둔 문자열 100개의 크기를 MB로 변환해 계산해보면 `0.0030 MB` 에 불과합니다. 약 33,000배 정도 차이가 나는 것을 확인 할 수 있습니다.

<img width="460" height="300" src="/static/images/project/url_result_pass.png"/>

문자열 형식이 더 효율적인 방식일거라고 예상했지만 단적인 예시로도 큰 차이가 나는 것을 확인 할 수 있었습니다.

### 그래서 마음메이트는 이미지를 어떻게 저장했을까?

이러한 실험결과를 바탕으로 마음메이트 서비스에서는 이미지서버를 통해 이미지를 저장하고 데이터베이스에는 생성한 URL을 저장하도록 했습니다.
현재 우리 서비스는 Cloudflare를 통해 프론트엔드를 호스팅하고 있고 도메인도 사용하고 있었고 R2 object storage 10GB를 무료로 제공해 서비스 초기단계에 적합하다고 판단해 R2 object storage를 이미지 서버로 사용하게 되었습니다.


참고자료:

[Hibernate ORM User Guide](https://docs.hibernate.org/orm/current/userguide/html_single/#basic-blob)

[이미지를 Blob 형태로 저장하기](https://logical-code.tistory.com/103)

[Spring Boot에서 S3에 파일을 업로드하는 세 가지 방법](https://techblog.woowahan.com/11392/)
