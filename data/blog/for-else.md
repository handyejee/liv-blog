---
title: 파이썬 for-else 문
date: '2022-11-07'
tags: ['python']
draft: false
summary: for-else 반복문을 통해 동일한 값이 여러개 있는 경우에도 확인해보자
---

## Intro 

셀레니움을 통해 특정 영역 전체에 있는 항목에 대한 값을 검증하려고 하다가, 반복문 중 for-else문을 사용해 확인할 수 있음을 알게되어 알게 된 내용을 정리해 보려고 합니다.

## for-else 문 

일반적인 반복문인 for 문은 아래와 같이 구성됩니다.

```python
lst = [dog, cat, sheep]
for i in lst:
    print(i)
```

여기서 제가 궁금했던 부분은 동일한 영역(예시에서는 리스트) 안에 값이 전부 동일한 경우 그 부분을 반복문으로 각각의 값이 일치하는지 였습니다. 그래서 for-else문을 통해 구현해 보았습니다.

```python
lst = [apple, apple, apple, apple]

for i in lst:
    if i != "apple":
         print("There's more than apple")
        break
else:
    print("There's only apple here")
```
위의 반복문을 실행하면,
lst안에 `apple`이 아닌 값이 있는 경우 `print("There's more than apple")` 프린트문을 실행한다. 
lst 안에 `apple` 만 있는 경우 `break`를 통해 반복문을 나와 `print("There's only apple here")`프린트 문을 출력하게 된다.

참고자료:<br></br> http://pyengine.blogspot.com/2019/12/for-else.html
