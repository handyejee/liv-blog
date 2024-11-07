---
title: '주문 서비스 팀 프로젝트 백엔드 계획서'
date: '2024-11-07'
tags: ['java', 'spring', 'MVC']
draft: false
summary: '팀 프로젝트 설계(22조 3프제)' 
---

주문 서비스 관련 팀 프로젝트를 진행하며 개발에 앞서 설계한 부분을 공유해 보았습니다.

## 1. API 명세서

| MVP         | 기능                | Method | 접근권한                          | Resources | URL                                          |
|-------------|-------------------------|--------|-----------------------------------|-----------|----------------------------------------------|
| 회원 관리   | 회원정보 수정           | PUT    | CUSTOMER, OWNER, MANAGER, MASTER | /users    | /api/users/{userId}                         |
|             | 회원정보 조회           | GET    | CUSTOMER, OWNER, MANAGER, MASTER |           | /api/users/me/info                          |
|             | 회원 탈퇴               | PATCH  | CUSTOMER, OWNER, MANAGER, MASTER |           | /api/users/{userId}                         |
| 인증        | 회원가입               | POST   | CUSTOMER, OWNER, MANAGER, MASTER | /auth     | /api/auth/signup                            |
|             | 로그인                 | POST   | CUSTOMER, OWNER, MANAGER, MASTER |           | /api/auth/signin                            |
|             | 로그아웃               | POST   | CUSTOMER, OWNER, MANAGER, MASTER |           | /api/users/signout                          |
|             | 토큰 재발급             | POST   | CUSTOMER, OWNER, MANAGER, MASTER |           | /api/auth/refresh                           |
| 음식점 관리 | 음식점 등록             | POST   | MANAGER, MASTER                  | /shops    | /api/shops                                  |
|             | 음식점 수정             | PUT    | MANAGER, MASTER                  |           | /api/shops{shopId}                          |
|             | 음식점 삭제             | PATCH  | MANAGER, MASTER                  |           | /api/shops{shopId}                          |
|             | 음식점 목록 조회        | GET    |                                   |           | /api/shops/                                 |
|             | 음식점 상세 조회        | GET    | CUSTOMER                         |           | /api/shops/{shopId}                         |
|             | 메뉴 등록               | POST   | OWNER, MANAGER, MASTER           | /menus    | /api/shops/{shopId}/menus                   |
|             | 메뉴 수정               | PUT    | OWNER, MANAGER, MASTER           |           | /api/shops/{shopId}/menus/{menuId}          |
|             | 메뉴 삭제(숨김)          | PATCH  | OWNER, MANAGER, MASTER           |           | /api/shops/{shopId}/menus/{menuId}          |
|             | 메뉴 조회 (가게별)      | GET    | OWNER, MANAGER, MASTER           |           | /api/shops/{shopId}/menus/{menuId}          |
| 주문 관리   | 주문 등록               | POST   | CUSTOMER                         | /orders   | /api/shops/{shopId}/orders                  |
|             | 주문 상태 변경           | PATCH  | CUSTOMER, OWNER, MANAGER, MASTER |           | /api/shops/{shopId}/orders/{orderId}/status |
|             | 주문 취소 요청           | POST   | CUSTOMER                         |           | /api/shops/{shopId}/orders/{orderId}/cancel |
|             | 주문 상세 조회           | GET    | CUSTOMER                         |           | /api/users/me/orders                        |
|             | 매장별 주문 조회         | GET    | OWNER, MANAGER, MASTER           |           | /api/shops/{shopId}/orders                  |
| 결제 관리   | 결제 요청               | POST   | CUSTOMER                         | /payments | /api/payments                               |
|             | 결제 취소               | POST   | CUSTOMER                         |           | /api/payments/{paymentId}/cancel            |
|             | 결제 조회               | GET    | CUSTOMER                         |           | /api/payments/{paymentId}                   |
| 배송지 관리 | 배송지 등록             | POST   | CUSTOMER                         | /addresses| /api/users/me/addresses                     |
|             | 배송지 수정             | PUT    | CUSTOMER                         |           | /api/users/me/addresses/{addressId}         |
|             | 배송지 삭제             | PATCH  | CUSTOMER                         |           | /api/users/me/addresses/{addressId}         |
|             | 배송지 조회             | GET    | CUSTOMER                         |           | /api/users/me/addresses                     |
| 음식 카테고리| 카테고리 등록           | POST   | MANAGER, MASTER                  | /categories| /api/categories                             |
|             | 카테고리 수정           | PUT    | MANAGER, MASTER                  |           | /api/admin/categories/{id}                  |
|             | 카테고리 삭제           | PATCH  | MANAGER, MASTER                  |           | /api/admin/categories/{id}                  |
|             | 카테고리 조회           | GET    | MANAGER, MASTER                  |           | /api/admin/categories                       |
|             | (사용자) 카테고리별 음식점 조회 | GET | CUSTOMER, OWNER, MANAGER, MASTER |           | /api/categories/{id}/shops                  |
| 리뷰 관리   | 리뷰 등록               | POST   | CUSTOMER, OWNER, MANAGER, MASTER | /reviews  | /api/reviews                                |
|             | 리뷰 수정               | PUT    | CUSTOMER, OWNER, MANAGER, MASTER |           | /api/reviews/{reviewId}                     |
|             | 리뷰 조회               | GET    | CUSTOMER, OWNER, MANAGER, MASTER |           | /api/reviews/{reviewId}                     |
|             | 매장별 리뷰 조회         | GET    | CUSTOMER, OWNER, MANAGER, MASTER |           | /api/shops/{shopId}/reviews                 |
|             | 리뷰 삭제               | PATCH  | CUSTOMER, OWNER, MANAGER, MASTER |           | /api/reviews/{reviewId}                     |
| AI 상품 설명 | 상품 설명 등록          | POST   | OWNER, MANAGER, MASTER           | /ai       | /api/ai/descriptions                        |
|             | 상품 설명 조회          | GET    | OWNER, MANAGER, MASTER           |           | /api/ai/descriptions                        |



## 테이블 명세서
### p_users 테이블
| 필드 이름 | 데이터 타입 | NOT NULL | 설명 |
|-----------|-------------|-----------|------|
| id | BIGINT | O | 사용자 ID, Primary Key |
| email | VARCHAR(255) | O | 사용자 이메일, Unique |
| password | VARCHAR(100) | O | 암호화된 비밀번호 |
| name | VARCHAR(20) | O | 이름 |
| nickname | VARCHAR(20) | O | 사용자 닉네임 |
| phone_number | VARCHAR(13) | O | 전화번호 |
| role | ENUM | O | 사용자 권한 (CUSTOMER, OWNER, MANAGER, MASTER) |
| created_at | TIMESTAMP | O | 레코드 생성 시간 |
| created_by | VARCHAR(20) | O | 레코드 생성자 (username) |
| updated_at | TIMESTAMP |  | 레코드 수정 시간 |
| updated_by | VARCHAR(20) |  | 레코드 수정자 (username) |
| deleted_at | TIMESTAMP |  | 레코드 삭제 시간 |
| deleted_by | VARCHAR(20) |  | 레코드 삭제자 (username) |

### p_order_menus 테이블
| 필드 이름 | 데이터 타입 | NOT NULL | 설명 |
|-----------|-------------|-----------|------|
| id | UUID | O | 주문 ID, Primary Key |
| shop_id | UUID | O | 가게 ID, Foreign Key |
| user_id | UUID | O | 회원 ID, Foreign Key |
| order_number | VARCHAR(100) | O | 주문번호(사용자 노출용) |
| status | ENUM | O | 주문 상태(PENDING, ACCEPTED, PREPARING, COMPLETED, CANCELLED) |
| payment_method | ENUM | O | 결제수단(CREDIT_CARD) |
| payment_status | ENUM | O | 결제상태 (REQUESTED, APPROVED) |
| delivery_fee | INT | O | 배달비 |
| discount_amount | INT | O | 할인 금액 |
| total_amount | INT | O | 주문 가격 |
| orderer_name | VARCHAR(20) | O | 주문자 이름 |
| orderer_phone | VARCHAR(13) | O | 주문자 번호 |
| delivery_address | VARCHAR(255) | O | 배달 주소 |
| delivery_request | VARCHAR(255) |  | 배달 요청사항 |
| shop_request | VARCHAR(255) |  | 매장 요청사항 |
| created_at | TIMESTAMP | O | 레코드 생성 시간 |
| created_by | VARCHAR(20) | O | 레코드 생성자 (username) |
| updated_at | TIMESTAMP |  | 레코드 수정 시간 |
| updated_by | VARCHAR(20) |  | 레코드 수정자 (username) |
| deleted_at | TIMESTAMP |  | 레코드 삭제 시간 |
| deleted_by | VARCHAR(20) |  | 레코드 삭제자 (username) |

### order_menus 테이블
| 필드 이름 | 데이터 타입 | NOT NULL | 설명 |
|-----------|-------------|-----------|------|
| id | BIGINT | O | 주문상세 번호 |
| order_id | BIGINT | O | 주문번호 |
| menu_id | BIGINT | O | 메뉴번호 |
| menu_name | VARCHAR(100) | O | 메뉴명 |
| menu_price | INT | O | 메뉴 가격 |
| quantity | INT | O | 수량 |
| total_price | INT | O | 최종 금액(메뉴 * 수량) |
| created_at | TIMESTAMP | O | 레코드 생성 시간 |
| created_by | VARCHAR(100) | O | 레코드 생성자 (username) |
| updated_at | TIMESTAMP |  | 레코드 수정 시간 |
| updated_by | VARCHAR(100) |  | 레코드 수정자 (username) |
| deleted_at | TIMESTAMP |  | 레코드 삭제 시간 |
| deleted_by | VARCHAR(100) |  | 레코드 삭제자 (username) |

### p_shops (가게)
| 필드 이름 | 데이터 타입 | NOT NULL | 설명 |
|-----------|-------------|-----------|------|
| id | UUID |  | 가게 ID, Primary Key |
| user_id | BIGINT | O | 회원 ID, Foreign Key |
| name | VARCHAR(20) | O | 가게명 |
| category_id | UUID | O |  |
| address | VARCHAR(255) | O | 가게주소 |
| phone_number | VARCHAR(13) | O | 전화번호 |
| opening_hour | datetime |  | 여는 시간 |
| working_hour | datetime | O | 닫는 시간 |
| min_order_amount | INT | O | 최소주문금액 |
| status | ENUM | O | 영업여부(OPEN,CLOSED,TEMPORARILY_CLOSED) |
| created_at | TIMESTAMP | O | 레코드 생성 시간 |
| created_by | VARCHAR(20) | O | 레코드 생성자 (username) |
| updated_at | TIMESTAMP |  | 레코드 수정 시간 |
| updated_by | VARCHAR(20) |  | 레코드 수정자 (username) |
| deleted_at | TIMESTAMP |  | 레코드 삭제 시간 |
| deleted_by | VARCHAR(20) |  | 레코드 삭제자 (username) |

### p_menus (메뉴)
| 필드 이름 | 데이터 타입 | NOT NULL | 설명 |
|-----------|-------------|-----------|------|
| id | UUID |  | 메뉴 ID, Primary Key |
| shop_id | UUID | O | 가게 ID, Foreign Key |
| name | VARCHAR(20) | O | 메뉴 이름 |
| price | INT | O | 메뉴 가격 |
| image | VARCHAR(255) |  | 메뉴 이미지 |
| status | ENUM | O | 메뉴 제공 가능 여부(POSSIBLE,IMPOSSIBLE,SOLDOUT) |
| created_at | TIMESTAMP | O | 레코드 생성 시간 |
| created_by | VARCHAR(20) | O | 레코드 생성자 (username) |
| updated_at | TIMESTAMP |  | 레코드 수정 시간 |
| updated_by | VARCHAR(20) |  | 레코드 수정자 (username) |
| deleted_at | TIMESTAMP |  | 레코드 삭제 시간 |
| deleted_by | VARCHAR(20) |  | 레코드 삭제자 (username) |

### p_categories (카테고리)
| 필드 이름 | 데이터 타입 | NOT NULL | 설명 |
|-----------|-------------|-----------|------|
| id | UUID |  |  |
| category_name | VARCHAR(20) | O | 카테고리명 |
| display_order | INT | O | 노출순서 |
| created_at | TIMESTAMP | O | 레코드 생성 시간 |
| created_by | VARCHAR(20) | O | 레코드 생성자 (username) |
| updated_at | TIMESTAMP |  | 레코드 수정 시간 |
| updated_by | VARCHAR(20) |  | 레코드 수정자 (username) |
| deleted_at | TIMESTAMP |  | 레코드 삭제 시간 |
| deleted_by | VARCHAR(20) |  | 레코드 삭제자 (username) |

### p_delivery_addresses (배송지)
| 필드 이름 | 데이터 타입 | NOT NULL | 설명 |
|-----------|-------------|-----------|------|
| id | UUID |  | 배송지 ID, Primary Key |
| address_name | VARCHAR(20) | O | 주소 이름(별명) |
| street_address | VARCHAR(255) |  | 도로명 주소 |
| detail_address | VARCHAR(100) |  | 상세주소 |
| postal_code | INT |  | 우편번호 |
| city | VARCHAR(10) |  | 도시 |
| state | VARCHAR(10) |  | 도 |
| is_default | BOOLEAN |  | 기본주소 여부 |
| user_id | BIGINT | O | 회원번호 |
| created_at | TIMESTAMP | O | 레코드 생성 시간 |
| created_by | VARCHAR(20) | O | 레코드 생성자 (username) |
| updated_at | TIMESTAMP |  | 레코드 수정 시간 |
| updated_by | VARCHAR(20) |  | 레코드 수정자 (username) |
| deleted_at | TIMESTAMP |  | 레코드 삭제 시간 |
| deleted_by | VARCHAR(20) |  | 레코드 삭제자 (username) |

### p_reviews (리뷰)
| 필드 이름 | 데이터 타입 | NOT NULL | 설명 |
|-----------|-------------|-----------|------|
| id | UUID |  | 리뷰 ID, Primary Key |
| shop_id | UUID | O | 가게 ID, Foreign Key |
| user_id | BIGINT | O | 회원 ID, Foreign Key |
| order_id | UUID | O | 주문 ID, Foreign Key |
| content | VARCHAR(255) | O | 내용 |
| rating | ENUM | O | 평점(ONE_STAR, TWO_STAR, THREE_STAR, FOUR_STAR, FIVE_STAR) |
| image | VARCHAR(255) |  | 이미지 |
| created_at | TIMESTAMP | O | 레코드 생성 시간 |
| created_by | VARCHAR(20) | O | 레코드 생성자 (username) |
| updated_at | TIMESTAMP |  | 레코드 수정 시간 |
| updated_by | VARCHAR(20) |  | 레코드 수정자 (username) |
| deleted_at | TIMESTAMP |  | 레코드 삭제 시간 |
| deleted_by | VARCHAR(20) |  | 레코드 삭제자 (username) |

### p_ai (AI 요청 테이블)
| 필드 이름 | 데이터 타입 | NOT NULL | 설명 |
|-----------|-------------|-----------|------|
| id | UUID |  | id |
| question | VARCHAR(50) | O | 요청 질문 |
| answer | VARCHAR(50) | O | 답변 |
| created_at | TIMESTAMP | O | 레코드 생성 시간 |
| created_by | VARCHAR(20) | O | 레코드 생성자 (username) |
| updated_at | TIMESTAMP |  | 레코드 수정 시간 |
| updated_by | VARCHAR(20) |  | 레코드 수정자 (username) |
| deleted_at | TIMESTAMP |  | 레코드 삭제 시간 |
| deleted_by | VARCHAR(20) |  | 레코드 삭제자 (username) |

### p_tokens (토큰)
| 필드 이름 | 데이터 타입 | NOT NULL | 설명 |
|-----------|-------------|-----------|------|
| id | UUID |  | 토큰 ID, Primary Key |
| user_id | BIGINT | O | 회원 ID, Foreign Key |
| token |  | O | 토큰 |
| created_at | TIMESTAMP | O | 레코드 생성 시간 |
| created_by | VARCHAR(20) | O | 레코드 생성자 (username) |
| updated_at | TIMESTAMP |  | 레코드 수정 시간 |
| updated_by | VARCHAR(20) |  | 레코드 수정자 (username) |
| deleted_at | TIMESTAMP |  | 레코드 삭제 시간 |
| deleted_by | VARCHAR(20) |  | 레코드 삭제자 (username) |

### p_payments (결제)
| 필드 이름 | 데이터 타입 | NOT NULL | 설명 |
|-----------|-------------|-----------|------|
| id | UUID |  | 결제 ID, Primary Key |
| order_id | UUID | O | 주문 ID, Foreign Key |
| payment_number | VARCHAR(50) | O | 결제 고유 번호 |
| total_amount | INT | O | 결제금액 |
| card_company | ENUM | O | 카드사 (SHINHAN,KB,KAKAOBANK) |
| card_number | VARCHAR(50) | O | 카드번호 |
| installment_months | ENUM |  | 할부개월( 1, 2, 3, 6) |
| requested_at | TIMESTAMP | O | 결제 요청 시간 |
| approved_at | TIMESTAMP |  | 결제 승인 시간 |
| cancelled_at | TIMESTAMP |  | 결제 취소 시간 |
| created_at | TIMESTAMP | O | 레코드 생성 시간 |
| created_by | VARCHAR(20) | O | 레코드 생성자 (username) |
| updated_at | TIMESTAMP |  | 레코드 수정 시간 |
| updated_by | VARCHAR(20) |  | 레코드 수정자 (username) |
| deleted_at | TIMESTAMP |  | 레코드 삭제 시간 |
| deleted_by | VARCHAR(20) |  | 레코드 삭제자 (username) |

## ERD 명세서
<img width="460" height="300" src="/static/images/project/1107_erd.png"/>


## 인프라 설계서

빠르고 간편하게 배포할 수 있도록 젠킨스, Docker 컨테이너 기반 배포자동화 구성하였습니다.
코드 푸쉬 -> 젠킨스 CI/CD 파이프라인 -> ECR 푸쉬 -> 이미지 배포

<img width="460" height="300" src="/static/images/project/infra.png"/>