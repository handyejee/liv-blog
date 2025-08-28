---
title: '스프링 프레임워크 첫걸음 - 5장 : MVC모델 알아보기'
date: '2024-07-21'
tags: ['Backend', '스프링 프레임워크 첫걸음']
draft: false
summary: '스프링에서 MVC모델을 사용해보자' 
---

5장에서는 스프링 MVC패턴에 대해 다룹니다. 먼저 MVC 패턴에 대해서 알아보고 스프링에서는 MVC 패턴을 어떻게 사용하는지 알아보겠습니다.

## 1. MVC 모델이란

MVC 모델이란 모델(Model), 뷰(View), 컨트롤러(Controller) 세 종류로 프로그램의 처리 역할을 각각 나눠 프로그램을 작성하는 것을 의미합니다.

- 모델(Model)<br></br>
모델은 시스템에서 비즈니스 로직을 담당합니다. 비즈니스 로직을 처리한다는 의미를 생각해보면, 예를 들어 사용자가 'abc@google.com' 이라는 아이디로 회원가입을 했다고 생각해봅시다. 사용자가 입력하고 회원가입을 시도하면, 해당 이메일 주소로 이미 가입한 사람이 있는지 중복확인을 하고 가입이력이 없다면 저장합니다. 이후 사용자가 가입했던 이메일 주소로 로그인을 시도하면, 아이디와 비밀번호를 확인하고 로그인을 하게 됩니다. 이렇게 데이터를 입력해서 저장하고 조회하는 과정들을 비즈니스로직 이라고 볼 수 있습니다.

- 뷰(View)<br></br>
뷰는 사용자의 입출력 값과 같은 부분을 담당하고, 웹 어플리케이션에서는 화면을 담당합니다.

- 컨트롤러(Controller)<br></br>
컨트롤러는 모델과 뷰를 제어하는 역할을 합니다. 위에서 나눠본 회원가입 로직을 다시 떠올려 보면, 컨트롤러는 뷰와 모델 사이에서 사용자가 입력한 이메일 주소를 데이터베이스에 전달하고, 유효한 아이디인지 여부를 다시 전달 받아서 뷰에 전달해주게 됩니다.

MVC 모델로 관리하게 되면 개발할때 변경이 있는 경우 보다 유연하게 대응할 수 있습니다. 

## 2. 스프링과 MVC

스프링 MVC는 '웹 애플리케이션을 간단하게 만들 수 있는 기능을 제공하는 프레임워크' 입니다.(p.116) 스프링 MVC에서 요청 - 응답까지의 흐름을 살펴보겠습니다.흐름에 대해 저자가 쉽고 명확하게 설명하고 있어 이미지는 재구성 하였으나 설명은 저자의 언어 그대로 가져와 정리해보겠습니다.

<img width="460" height="300" src="/static/images/springstudy/springmvc.png"/>

1) DispatcherServlet은 클라이언트로부터 요청을 수신합니다. 
2) DispatcherServlet이 컨트롤러의 요청 핸들러 메서드를 호출합니다.
3) 컨트롤러는 비즈니스 로직 처리를 호출하고, 처리 결과를 받아 
4) 처리결과를 모델로 설정하고, 뷰 이름을 반환합니다.
5) 반환된 뷰 이름을 받아 DispatcherServlet이 뷰 이름에 대응하는 뷰에 대해 화면 표시 처리를 의뢰합니다.
6) 마지막으로 클라이언트가 응답을 받고 브라우저에 화면이 표시됩니다.

## 3. 스프링에서 MVC 프로그램 만들기

컨트롤러에 요청 핸들러 메서드를 만든 후 뷰를 생성해 브라우저에 "Hello View!!!"를 표시하는 프로그램을 만들어 보겠습니다. 먼저, 스프링 프로젝트를 생성합니다. 의존관계는 아래와 같이 생성하였습니다.

- Spring Boot DevTools(개발 툴)
- Thymeleaf(템플릿 엔진)
- Spring Web(웹)

스프링부트 프로젝트를 생성했다면, 컨트롤러를 생성해주겠습니다. 자바에서 controller 이름의 패키지를 생성한 다음, HelloViewController 이름의 컨트롤러 클래스를 생성합니다. 이때 컨트롤러는 상속과 같은 처리를 하지 않는 POJO(Plain Old Java Object) 클래스로 생성합니다.

```java
package livoi.mvctest.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("hello")
public class HelloViewController {

    @GetMapping("view")
    public String helloView(){
        return "hello";
    }
}
```

위 코드에서 사용한 몇가지 어노테이션을 살펴보겠습니다.

1. *@Controller*<br></br>
어노테이션을 통해 해당 클래스가 컨트롤러 인것을 나타내고 bean에 등록합니다. `@Controller` 어노테이션을 호출하면 요청 핸들러 메서드의 반환값을 뷰 이름으로 하여 템플릿 엔진의 뷰가 응답 HTML을 생성합니다. 여기서는 return 값인 hello가 템플릿 엔진의 뷰가 됩니다.

2. *@RequestMapping*<br></br>
`@RequestMapping` 어노테이션은 컨트롤러의 요청 핸들러 메서드와 URL을 매핑하게 됩니다. `@GetMapping` 을 통해 GET 메서드로 요청, `@PostMapping`을 통해 POST 메서드로 요청을 보낼 수 있습니다.

### URL 매핑
클래스에 `@RequestMapping("hello")` 어노테이션과 요청 핸들러 메서드의 `@GetMapping("view")` 어노테이션을 통해 클라이언트는 'hello/view' URL을 통해 접근할 수 있습니다.

### 뷰 생성
다음으로 뷰를 생성해주겠습니다. 뷰를 생성하는 위치는 resources/templetes 폴더 하단에 생성해야하는 규칙이 있습니다. hello 라는 이름의 html 파일을 만든 후, body에 'Hello View!!!' 라는 텍스트를 h1 태그 안에 넣어줬습니다. 

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>View Sample</title>
</head>
<body>
    <h1>Hello View!!!</h1>
</body>
</html>
```

### 스프링부트 실행
html 파일까지 만들어줬다면, 스프링부트 기동클래스를 실행해보겠습니다. 톰캣서버가 정상적으로 실행되었다면, 컨트롤러에서 생성했던 주소인 'http://localhost:8080/hello/view' URL을 들어가보면 아래와 같이 입력했던 html 이 출력되는 것을 확인할 수 있습니다.

<img width="460" height="300" src="/static/images/springstudy/helloview.png"/>

## 정리

5장에서는 MVC모델에 대해서 알아보고 직접 스프링 MVC 컨트롤러를 생성해 화면에 출력해주는것 까지 알아봤습니다. 개인적으로는 절차지향과 차이를 만들어주는 부분이 컨트롤러가 아닐까 하는 생각이 들었는데, 전달하고자 하는 값이 화면과 데이터베이스에 직접 전달되지 않기 때문에 더 편리하고 안전하게 값을 전달해 줄 수 있다는 생각이 들었습니다.

참고자료: <br></br>[스프링프레임워크 첫걸음](https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=301096602), 후루네스 키노시타 마사아키<br></br>https://developer.mozilla.org/ko/docs/Glossary/MVC
