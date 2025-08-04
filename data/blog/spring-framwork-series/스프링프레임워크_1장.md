---
title: 스프링 프레임워크 첫걸음 - 1장
date: '2024-06-23'
tags: ['Backend', '스프링 프레임워크 첫걸음']
draft: false
summary: 프레임워크와 스프링, 그리고 PostgreSQL 
---

## 스프링 프레임워크 

스프링 프레임워크 첫걸음 책을 공부하면서 알게된 점을 앞으로 매주 한 챕터씩 정리해보려고 합니다.

목적은 스프링 사용법 뿐만 아니라 스프링의 원리를 이해하고, 자바를 더 자유롭게 활용할 수 있는 것에 있습니다.

1장은 프레임워크의 개념에 대한 간단한 설명과 스프링 프레임워크에 대한 설명, 스프링을 사용하기 위한 환경 설정으로 구성되어 있습니다.

그 중 데이터베이스는 PostgreSQL을 사용하는데, 오픈소스 기반으로 만들어진 관계형 데이터베이스 입니다. MySQL 과 같은 다른 관계형 데이터베이스와 어떤 차이가 있는지 한번 살펴봤습니다.

### PostgreSQL의 특징

1. 객체-관계형 데이터 베이스
    - 데이터를 속성을 가진 객체로 저장
2. 동시성제어(MVCC)
    - 사용자가 무결성 손상 없이 데이터를 동시에 읽고 수정 가능

PostgreSQL의 동시성 제어 기능은 복잡한 로직을 가진 실제 어플리케이션 동작시에 더 효과적입니다.

참고자료:<br></br> [What is Postgresql](https://www.postgresql.org/docs/current/intro-whatis.html)
<br></br>[The difference between MySQL and Postgresql](https://aws.amazon.com/ko/compare/the-difference-between-mysql-vs-postgresql/)
<br></br>[스프링과 스프링부트](https://www.codestates.com/blog/content/%EC%8A%A4%ED%94%84%EB%A7%81-%EC%8A%A4%ED%94%84%EB%A7%81%EB%B6%80%ED%8A%B8)
