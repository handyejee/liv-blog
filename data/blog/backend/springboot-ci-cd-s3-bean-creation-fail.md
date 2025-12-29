---
title: Spring Boot CI 빌드 에러 해결: 테스트 코드가 없는데도 왜 빈 생성에 실패할까?
date: '2025-12-29'
tags: ['Backend', 'java', 'CI/CD', 'GitHubActions', '마음메이트', 'maummate', 'TroubleShooting']
draft: false
summary: 이미지 업로드 기능을 배포한 후 CI/CD를 도입하며 발생한 Failed to load ApplicationContext 에러를 해결하며 테스트코드가 없어도 의존성이 왜 필요한지 정리했습니다.
---

## 문제상황

[마음메이트](https://maummate.com/) 프로젝트를 진행하며 상담사 이미지를 저장하는 API를 개발하고 배포를 진행했습니다. Cloudflare R2를 사용해 이미지 업로드 기능을 개발했고 운영환경에 이미 배포가 되어있었습니다. 따라서 환경설정과 CI/CD 스크립트만 작성하면 된다고 생각해 로컬에서 CI/CD를 위한 브랜치를 생성해 각각 스크립트를 작성하고 머지를 시도했는데 빌드단계에서 실패했습니다.

![Build Error Message](/images/project/build_error_message.png)

`Failed to load ApplicationContext` 에러는 스프링부트 테스트를 실행할 때 애플리케이션 설정 관련된 오류가 있을 때 나타나는 에러입니다. 구글에 오류 메세지를 검색해보면 대부분 환경설정이 잘못되어서 발생하는 것으로 보입니다. 상세한 오류를 확인하기 위해 스크립트에 테스트 결과를 저장해서 볼 수 있도록  CI 스크립트에 아래 내용을 추가했습니다.

```yaml
- name: Upload test results
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: test-results
    path: build/reports/tests/test/
    retention-days: 5
```

![Testcode Fail Message](/images/project/test_error.png)

파일을 확인해 보면 Access key가 null로 들어가서 NullPointerException가 발생했습니다. 여기까지는 흔히 발생하는 개발자 실수 입니다. 그런데 문제가 발생한 시점은 기능 배포 시점이 아닌 CI/CD 스크립트를 도입한 시점이었습니다. 로컬환경과 운영환경에서 이미지 업로드 기능에 대해서 검증이 완료되었고 지금도 기능이 동작하고 있습니다. 그런데 Access key가 없다는 에러가 발생한 것입니다.

## 원인 분석

Access key ID가 null값이라는 에러가 발생하는 구간은 빌드 단계에서 `test` 였다는 부분(`> Task :test`)에서 힌트를 얻을 수 있습니다. 문제가 발생한 근본적인 원인은 CI를 수행할 때 테스트가 수행되는 환경이 독립적인 환경이라는 부분을 포함하지 못해서 입니다. main과 develop에 PR이 생성될 때 CI 스크립트가 실행되는데, 이 스크립트는 `ubuntu-latest` 환경에서 실행됩니다. 그동안 테스트를 해온 로컬, 운영 환경이 아닌 독립적인 환경이라는 의미입니다.

제가 이 부분을 놓쳤던 이유는 이미지 관련된 테스트코드가 없기 때문에 실행되는 문제가 생기지 않을 것이라고 생각했기 때문입니다. 로컬 환경에서는 Intellij 내부에 환경변수 설정을 통해서 읽어오고 있었고, 운영환경에서는 별도의 yaml 파일로 관리하고 있어 해당 부분의 누락을 인지하지 못한 것이었습니다.

### 스프링 내부의 동작

스프링부트에서는 서버를 실행할 때 `@SpringbootApplication` 어노테이션은 내부적으로 세가지 기능을 허용합니다. 먼저 `@SpringBootConfiguration` 어노테이션을 통해 스프링이 메인 클래스를 찾고 전체 설정을 로드합니다. 그리고 `@ComponentScan` 을 실행합니다. 이 때 `@Service`, `@Repository`와 같은 스테레오타입 에너테이션을 읽어오고 빈 생성을 시도합니다. 문제가 되었던 지점은 컴포넌트 스캔을 하는 과정에서 ‘의존성 전파’의 오류입니다.

1. 빈 생성 실패
    스캔 과정에서 `S3Client`를 생성을 시도하지만 CI 환경에는 Access Key가 없어 S3Client 빈은 생성되지 않습니다.
2. 연쇄적 주입 오류
    이어서 이미지를 업로드하는 `FileUploadService`를 만들려고 하는데 필수적인 `S3Client`가 보이지 않자 에러를 던집니다. 마찬가지로 이 서비스를 필요로 하는 `Controller`까지 줄줄이 생성에 실패하게 됩니다.
테스트코드가 실행될 때 `@SpringBootTest` 어노테이션은 애플리케이션의 모든 빈을 메모리에 올리려고 시도합니다. CI 환경에서는 S3관련된 값들을 설정하지 않았기 때문에 이미지 관련 테스트코드가 없어도 `@SpringBootApplication` 설정에 따라 프로젝트를 스캔하고 빈 생성을 시도하는 과정에서 실패가 발생한 것입니다.

```java
@SpringBootTest
class TestApplicationTests {

    @Test
    void contextLoads() {
    }

}
```

## 해결방법

### 테스트 Profile 분리

문제를 해결하기 위해 테스트 전용 Profile을 분리하고 환경 설정을 격리하는 방법을 선택했습니다.

스프링 부트는 `src/test/resources` 폴더에 `application.yml`이 있으면 테스트 실행 시 `src/main/resources`에 있는 메인 설정보다 이 파일을 우선적으로 읽습니다. 이 메커니즘을 이용해 CI 환경에서도 빌드가 깨지지 않도록 설정을 구성했습니다.

1. 테스트용 환경 설정 파일 생성

`src/test/resources/application.yml` 파일을 생성하고, 프로파일을 `test`로 지정했습니다.

```yaml
spring:
  profiles:
    active: test
```

2. 애플리케이션 내부에서 Profile이 test가 아닌경우에만 동작하도록 `@Profile("!test")`를 추가합니다.ㄴ
의존성에서 연관이 있던 Client 설정을 하는 Config 클래스, Service 클래스, Controller 클래스에 각각 추가했습니다. 이를 통해 테스트 환경에서는 이미지 관련 모듈 자체가 스프링 컨텍스트에 등록되지 않도록 격리했습니다.

```java
@Service
@Profile("!test")
@RequiredArgsConstructor
public class FileUploadService {
}
```

> Service 클래스 예시

`@Profile("!test")` 방식은 해당 모듈의 테스트까지 제한한다는 단점이 있습니다. 하지만 현재는 인프라 설정이 미비한 CI 빌드를 성공시키는 것이 우선순위였기에 이 방식을 선택했습니다.

### 이미지 관련된 테스트 코드가 존재했다

흥미로운 부분은 프로젝트 내에 이미지 관련 테스트 코드가 아예 없었던 것은 아니라는 사실입니다. 리소스 누수를 확인하는 단위 테스트가 존재했지만 이 테스트는 무사히 CI를 통과했습니다.

이유는 간단했습니다. 해당 테스트는 `@SpringBootTest`를 사용하지 않는 순수 단위 테스트였기 때문입니다. 스프링 컨테이너를 구동하지 않고 자바 객체 수준에서만 실행되었기 때문에 S3 설정값이 없어도 테스트가 정상적으로 실행되었던 것입니다.

### 통합테스트를 도입하게 된다면 ?

현재는 이미지 업로드 기능에 대해 통합테스트를 고려하고 있지 않기 때문에 단위테스트로 테스트코드를 작성했습니다. 하지만 통합테스트가 필요한 시점이 되면 `application.yml`에 가짜(더미) 설정값을 주입하거나, `@MockBean`을 활용해 실제 인프라 없이도 빈이 생성되도록 구성할 수 있습니다.

## 정리

CI를 도입하면서 빌드 과정에서 발생한 contextLoad 에러에 대해서 살펴봤습니다. CI 스크립트에서 실행되는 환경은 로컬과 운영 서버와는 다른 환경이고, 내부의 설정은 CI 서버에 자동으로 전달되지 않습니다. 따라서 환경 의존성을 줄이기 위해서는 테스트 환경을 별도의 Profile로 분리하는 방법을 사용하거나 기존의 환경설정에서 임의의 값을 사용해 있는 것 처럼 보이게 할 수도 있습니다.

참고자료:

[Using the @SpringBootApplication Annotation](https://docs.spring.io/spring-boot/reference/using/using-the-springbootapplication-annotation.html#page-title)

[Testing Spring Boot Applications](https://docs.spring.io/spring-boot/reference/testing/spring-boot-applications.html)

[Continuous integration](https://docs.github.com/en/actions/get-started/continuous-integration)
