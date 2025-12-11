---
title: ElementCollection을 사용할때 LazyLoading 문제
date: '2025-12-10'
tags: ['Backend', 'java']
draft: false
summary: Value Object를 사용할때 재정의 해야 하는 이유
---
**💡 핵심질문 1:** Lazy Loading이 유발하는 Lazy Initialization Exception의 발생 원리와 JPA 동작 원리는 무엇일까요?

**💡 핵심질문 2:** @ElementCollection과 같은 To-Many 관계에서 Lazy Initialization Exception을 해결할 수 있는 전략은 무엇인가요?

## 문제상황

마음메이트 프로젝트를 진행하며 상담사 조회 기능을 개발하고 상담사 단건 조회를 테스트 하던 중 아래와 같은 에러 메세지가 출력되는 것을 발견했습니다.

``` text
.w.s.m.s.DefaultHandlerExceptionResolver : Resolved [org.springframework.http.converter.HttpMessageNotWritableException: Could not write JSON: failed to lazily initialize a collection of role: com.maummate.maummatebackend.counselors.entity.Counselor.specializations: could not initialize proxy - no Session]
```

**failed to lazily initialize** 부분을 통해 Lazy Loading과 관련된 문제라는 것을 알게되었습니다. 자바 스프링을 공부하다보면 가장 많이 등장하는 자주 나오는 문제가 Lazy Loading 문제 입니다. 오류 메세지가 나왔지만 사실 속으로는 드디어 문제 해결의 기회가 찾아왔군! 하는 생각이 들었습니다. 문제의 원인과 해결 방식을 함께 살펴보겠습니다.

## 원인 분석

### LazyLoading 이란 ?

Lazy Loading은 스프링 JPA/Hibernate에서 연관된 엔티티를 실제로 사용할 때까지 로딩을 미루는 전략입니다. 연관관계가 있는 경우에 사용합니다. 스프링에서 `(fetch = FetchType.LAZY)` 로 설정한 경우 Lazy Loading 전략을 사용한다고 인식합니다.

```java
@BatchSize(size = 100)
@ElementCollection(fetch = FetchType.LAZY)
@CollectionTable(
        name = "counselor_specializations",
        joinColumns = @JoinColumn(name = "counselor_id")
)
@OrderColumn(name = "display_order")
@Enumerated(EnumType.STRING)
@Column(name = "specialization", nullable = false)
private List<Specialization> specializations = new ArrayList<>();
```

LazyLoading이 동작하는 방식은 다음과 같습니다.

1. 스프링에서 `@Transactional` 어노테이션이 감지되면 트랜잭션을 시작합니다.
2. Hibernate는 Session을 열고 JPA의 영속성 컨텍스트가 생성됩니다.
3. repository를 조회하는 비지니스 로직이 호출되면 데이터베이스에서 로드 되어 영속성 컨텍스트에 저장됩니다.
4. 여기서 Lazy Loading으로 설정된 연관 객체 필드는 실제 데이터가 아닌 Hibernate가 프록시 객체를 생성해서 주입하게 됩니다.
5. 프록시 객체의 메서드를 호출하고 실제 데이터에 접근할 때 프록시 객체가 SQL 쿼리를 실행해 데이터를 로드합니다. 이 과정을 `Lazy Initialization`(지연 초기화)라고 부릅니다.
6. 메서드 실행이 완료되어 종료되고 TransactionManager.commit()을 통해 Commit이 실행되면 Hibernate Session이 닫히고 스프링 AOP 프록시로 복귀합니다.

그런데 LazyLoading을 정의한 곳 옆에  `@ElementCollection` 어노테이션이 있습니다. specializations 컬럼은 Enum으로 만들어진 여러개의 전문분야를 저장하기 위해서 `@ElementCollection` 을 통해 사용했습니다. `@ElementCollection` 은 Enum 타입과 같이 여러개의 값 타입을 저장할 때 사용되는 JPA 어노테이션 입니다. `@ElementCollection`을 선언하게 되면 내부적으로 counselor_specializations 라는 테이블을 생성하고 여러개의 전문분야 항목을 저장합니다. 이 부분이 일반적인 LazyLoading 문제와 다르게 동작하는 이유입니다.

이 과정을 이해하기 위해서는 `@Transactional` 어노테이션이 어떻게 동작하는지 동작 원리를 살펴봐야 합니다. 개발자가 작성한 코드가 실행될 때 스프링 내부에서 어떻게 동작하는지 살펴보겠습니다.

### `@Transactional` 어노테이션 동작과정

<img width="460" height="300" src="/static/images/project/transaction_sequence_diagram.png"/>

1. (비지니스 로직) Service 비지니스 로직에서 `@Transactional` 어노테이션을 사용합니다. 여기서는 상담사 단건조회 로직을 예시로 들어보겠습니다.

상담사 단건조회를 하기 위해 JpaRepository **에서 기본적으로 제공하는 `findById()` 메서드를 통해서 조회합니다.

```java
@Transactional(readOnly = true)
public CounselorDetailResponse getCounselorById(Long counselorId) {
    Counselor counselor = counselorRepository.findById(counselorId)
            .orElseThrow(() -> new IllegalArgumentException("Counselor not found with id: " + counselorId));

    return CounselorDetailResponse.from(counselor);
}
```

2. (스프링) 스프링이 애플리케이션을 실행할때 BeanPostProcessor가 모든 빈을 검사합니다. 자바 Reflection을 사용해 `@Transactional` 어노테이션이 붙은 클래스와 메서드를 감지합니다.
    - 자바 Reflection은 런타임에 클래스, 메서드, 필드와 같은 정보를 검사하고 조작할 수 있는 자바 API입니다. 어노테이션의 정보를 읽는 것도 자바 Reflection이 수행합니다.
3. (스프링) 스프링 AOP는 감지된 클래스(대상 객체)를 감싸는 프록시 객체를 생성하고, 원본 대신 프록시를 Spring Bean으로 등록합니다.
    - 프록시 패턴 : Client -> Proxy -> Real Object(실제 비지니스 로직)
4. (스프링) 클라이언트가 메서드를 호출하면 실제 대상 객체가 아닌 프록시 객체의 메서드가 호출되면서 인터셉트됩니다.
    - 프록시가 가짜 객체 프록시를 생성해 진짜 객체는 수정하지 않고 원본을 보존합니다. 이때 프록시를 통해서 생성한 객체는
    1. 어플리케이션을 실행하는 동안 재사용됩니다.
    2. 같은 클래스 내 모든 메서드를 사용할 때 재사용 됩니다
    3. 배포환경에서도 재배포하기 전까지 재사용 됩니다

    이렇게 프록시를 재사용 함으로서 비지니스로직은 트랜잭션과 같은 또 다른 로직을 신경쓰지 않고 비지니스로직에만 집중할 수 있습니다(관심사 분리). 또한 트랜잭션을 사용할때 커밋.롤백과 같은 코드 중복이 기능마다 생기는 코드중복을 방지합니다(중복코드 방지).

5. (스프링) 프록시는 스프링 내부의 TransactionInterceptor (트랜잭션 AOP Advice)를 실행합니다. 인터셉트 내에서 트랜잭션을 시작합니다.
6. (비지니스 로직) 트랜잭션 컨텍스트 내에서 실제 대상 객체의 메서드가 호출됩니다.
7. (스프링) 실제 메서드가 성공적으로 종료되면 Commit을 수행합니다. 예외가 발생해 실패할 경우 Rollback을 수행합니다.
8. (스프링) 트랜잭션이 종료된 후에 최종 결과가 클라이언트에 반환됩니다.

### Lazy Loading은 Transaction과 어떤 관련이 있을까요?

앞서 트랜잭션 동작방식에서 스프링 AOP는 `@Transactional` 어노테이션을 확인하고 트랜잭션을 시작한다고 했습니다. 이때 트랜잭션의 생명주기에 맞춰 Hibernate는 Session을 열고 영속성 컨텍스트가 생성됩니다.

Counselor 엔티티 내부에 있는 `specializations` 필드는 Lazy Loading으로 설정되어 있습니다. `@ElementCollection` 설정 때문에 트랜잭션 동안 `specializations` 컬렉션은 앞에서 살펴본 프록시가 아닌 Hibernate의 컬렉션 래퍼(Wrapper) 객체가 주입됩니다. 이 객체가 가지고 있는 값은 엔티티 ID와 활성화된 session입니다. 즉 실제 값이 아닌 주소값만 가지고 있습니다.

그런데 Service 계층에서 Counselor 조회 로직이 완료되면 `@Transactional`에 의해 트랜잭션이 Commit 되고 Hibernate session도 닫히게 됩니다. Controller가 반환하는 엔티티 객체를 JSON 직렬화할 때 Jackson이 컬렉션 필드의 래퍼 객체에 접근합니다. 이 래퍼 객체는 이미 닫힌 Hibernate Session을 통해 데이터베이스 조회를 시도하지만, 세션이 닫혔기 때문에 데이터를 가지고 올 수 없고 JSON 변환에 실패합니다. (오류 메세지에서 Could not write JSON이 출력되는 이유입니다)

<img width="460" height="300" src="/static/images/project/lazy_initialization_exception.png"/>

## 해결방법

### Lazy Loading으로 인한 Lazy Initialization 문제를 해결하려면?

해결방법을 생각해보면 닫힌 Hibernate Session에 접근하는게 문제였기 때문에 데이터가 필요한 시점까지 세션을 열어두거나 세션이 닫히기 전에 데이터를 미리 로드해 두는 방식으로 해결할 수 있습니다.

### Fetch Join 방식

처음에 도입을 하려고 했던 Fetch Join 방식은 JPA에서 제공하는 구문으로 Hibernate에게 Fetch Join으로 설정된 연관관계에 대해서 Lazy Loading 방식이 아닌 Eager Loading으로 즉시 조회해오도록 만드는 구문입니다.

아래와 같이 JPQL을 통해서 명시적으로 수행해야 할 쿼리를 `findDetailsById()` 라는 메서드를 생성해 실행하도록 추가했습니다.

```java
@Repository
public interface CounselorRepository extends JpaRepository<Counselor, Long> {

    @Query("SELECT DISTINCT c FROM Counselor c " +
            "JOIN FETCH c.specializations s " +
            "JOIN FETCH c.credentials cd " +
            "JOIN FETCH c.user u " +
            "WHERE c.counselorId = :counselorId")
    Optional<Counselor> findDetailsById(@Param("counselorId") Long counselorId);
}
```

Fetch Join을 실행하게 되면 Lazy Loading으로 설정된 컬렉션에 대해서 프록시 객체가 아닌 실제 데이터가 초기된 상태가 됩니다. 따라서 앞서 문제가 되었던 직렬화 시점에 이미 데이터를 가지고 있기 때문에 데이터를 가져올 수 있게 됩니다.

그런데 Fetch Join을 사용할때 카테시안 곱 문제가 발생할 수 있습니다. 현재 credentials 필드와 specializations 필드는 복수 선택이 가능한 항목이고 각각 최대 13개, 10개의 enum으로 되어 있어 fetch join을 했을때 최대 `13 x 10 = 130`개 의 행이 생성될 수 있어 조회 성능에 문제가 생길 수 있습니다. 이렇게 복수의 값을 조회해야 하는 경우에 Fetch Join은 적합하지 않습니다.

### `@Batchsize` 방식

```java
@BatchSize(size = 100)
@ElementCollection(fetch = FetchType.LAZY)
@CollectionTable(
        name = "counselor_specializations",
        joinColumns = @JoinColumn(name = "counselor_id")
)
@OrderColumn(name = "display_order")
@Enumerated(EnumType.STRING)
@Column(name = "specialization", nullable = false)
private List<Specialization> specializations = new ArrayList<>();
```

카테시안 곱 문제를 방지하기 위해 `@Batchsize` 의 도입을 고려해볼 수 있습니다. `@Batchsize` 어노테이션은 (size = number) 에 설정되어 있는 부모엔티티의 ID를 최대 몇개까지 모아 하나의 SQL 쿼리로 연관된 데이터를 가져올지 지정하는 값입니다. 일반적으로 `@Batchsize`는 목록조회를 할때 N+1 문제를 해결할 수 있는 방법으로 사용됩니다.

단건조회에서는 카테시안곱 문제를 우회하는 전략으로 활용할 수 있습니다. `@Batchsize` 가 적용된 컬렉션은 LazyLoading 전략이 유지되기 때문에 JOIN이 발생하지 않습니다.

### DTO 초기화 방식

실질적으로 LazyLoading 지연초기화 문제를 해결하는 방법은 조회 시점에 객체를 초기화하는 것입니다. 아래 목록조회 응답DTO를 예시로 내부에서 어떻게 동작하는지 살펴보겠습니다.

```java
public static CounselorListResponse from(Counselor counselor) {
        return new CounselorListResponse(
                counselor.getCounselorId(),
                new ArrayList<>(counselor.getSpecializations())

        );
    }
```

1. `counselor.getSpecializations()`  에는 위에서 살펴본 `@ElementCollection` 어노테이션을 통해 래퍼객체가 담겨 있다는 것을 확인했습니다.
2. `from()` 정적 팩토리 메서드가 호출될 때 `new ArrayList<>` 는 내부 객체를 복사하려는 시도를 합니다. 강제 지연 초기화(Lazy Initialization)
3. 지연 초기화 요청을 받은 래퍼 객체는 활성화된 Hibernate Session이 있는지 확인한 후, 부모 엔티티의 ID로 컬렉션 데이터를 조회하는 쿼리를 실행합니다.

    ```sql
    SELECT * FROM counselor_specializations WHERE counselor_id = ?
    ```

4. DB에서 조회된 데이터가 래퍼 객체에 메모리로 로드되고 이 때 래퍼 객체가 초기화(Initialized) 상태가 됩니다.
5. 이후 트랜잭션이 Commit되고 Hibernate Session이 닫힙니다. 따라서 이후 Json으로 직렬화 하는 과정에서 데이터를 조회하지 않고 사용할 수 있게 됩니다.

## 정리

스프링 JPA를 사용하다가 발생할 수 있는 Lazy Initialization 문제에 대해서 살펴봤습니다. `@ElementCollection`을 사용해 여러 값 객체를 저장하는 경우 Lazy Loading 전략을 사용하는 할 때 래퍼 객체가 생성되고 트랜잭션 밖에서 접근을 시도할 때 Lazy Initialization Exception이 발생한다는 것을 확인했습니다.

지연 초기화 문제를 해결하기 위해서 값을 반환하는 시점에 DTO에서 직접 초기화를 해주는 방법을 선택해서 데이터베이스를 조회해도록 했습니다. `@Batchsize` 어노테이션을 사용해 Fetch Join시 발생할 수 있는 카테시안곱 문제를 우회하는 전략도 사용했습니다.

트랜잭션 어노테이션으로 스프링 내부가 어떻게 동작하는지, Lazy Loading 전략을 사용했을 때 조회하는 방식, 그리고 N+1 문제를 방지할 수 있는 방법에 대해서 알게되었습니다.

이 글을 통해 스프링 백엔드 프로젝트를 하다 보면 자주 만나는 문제를 분석해보고 이해하는데 작은 도움이 되었으면 좋겠습니다.

참고자료:

[[JPA] 일반 Join과 Fetch Join의 차이](https://cobbybb.tistory.com/18)

[JPA Query Methods](https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html)

[Spring-JPA-LazyInitializationException-발생-원인-및-해결-방법](https://rla124-dev-log.tistory.com/entry/Spring-JPA-LazyInitializationException-%EB%B0%9C%EC%83%9D-%EC%9B%90%EC%9D%B8-%EB%B0%8F-%ED%95%B4%EA%B2%B0-%EB%B0%A9%EB%B2%95)
