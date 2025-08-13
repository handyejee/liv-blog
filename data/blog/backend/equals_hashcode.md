---
title: equals & hashCode란?
date: '2025-08-12'
tags: ['Backend', 'java']
draft: false
summary: Value Object를 사용할때 재정의 해야 하는 이유
---
```text
핵심질문 1: equals와 hashCode를 재정의 하는 이유?
핵심질문 2 : 왜 equals를 재정의하면 hashCode도 함께 재정의해야 할까?
```

값 객체(Value Object)에 대한 강의를 듣다가, equals & hashCode에 대한 부분이 나왔습니다. 여러번 살펴봤었는데 매번 새롭게 느껴져 정리를 해보았습니다.

### 언제 사용할까 ?

도메인로직에서 equals & hashCode를 재정의해야 하는 경우는 Value Object인 경우, 즉 값에 의해 식별을 해야할 때 입니다. 주소, 금액, 이름과 같이 참조 값이 다른 경우에도 값이 같다면 같은 값으로 간주되어야 하는 경우 사용합니다. 일반적으로 아래와 같이 클래스 선언부 하단에 equals 메서드와 hashCode 메서드를 재정의 합니다.

```java
public class Person {
    private String name;
    private int age;
    
    // 생성자
    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }
    
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        Person person = (Person) obj;
        return age == person.age && Objects.equals(name, person.name);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(name, age);
    }
}
```

### 재정의 한다는건 ?

equals & hashCode개념과 같이 자주 등장하는 단어가 `재정의` 라는 단어 입니다.

```text
An instance method in a subclass with the same signature (name, plus the number and the type of its parameters) and return type as an instance method in the superclass *overrides* the superclass's method.

하위 클래스에서 상위 클래스의 인스턴스 메서드와 같은 시그니처(이름, 매개변수 개수와 타입)와 리턴타입을 가진 인스턴스 메서드는 상위 클래스의 메서드를 재정의한다. 
```

*출처 : https://docs.oracle.com/javase/tutorial/java/IandI/override.html*

여기서 알 수 있는것은 재정의가 메서드 시그니처가 같으면 자동으로 일어난다는 것입니다.

본래의 질문으로 다시 돌아와 equals와 hashCode를 재정의 한다는 것은 equals()나 hashCode() 메서드를 사용하는 것과 어떤 차이가 있을까요?

equals() 메서드 사용

```java
public class Person {
	private String name;
	private int age;
}

Person p1 = new Person("김철수", 25);
Person p2 = new Person("김철수", 25);

System.out.println(p1.equals(p2)); // false (다른 메모리 주소)
System.out.println(p1 == p2);      // false (참조 비교)
```

equals 메서드를 재정의 없이 사용했을때 p1과 p2 객체를 출력해보면 각각 김철수와 25라는 같은 값이 들어있지만 값이 아닌 메모리 주소를 비교하기 때문에 false를 반환합니다.

`java.lang.Object` 클래스의 equals 구현체를 살펴보면 메모리 주소를 비교하고 있기 때문입니다.

```java
public boolean equals(Object obj) {
        return (this == obj);
    }
```

hashCode 역시 java.lang.Object 에 구현되어 있습니다. 여기서 native 키워드는 자바가 아닌 다른 언어로 구현된 메서드를 의미합니다.

```java
public native int hashCode();
```

앞서 살펴봤던 동일한 Person 클래스에서 HashSet에 p1을 추가하고 내용이 같은 p2가 존재하는지 확인해보면 false가 나옵니다.

```java
Person p1 = new Person("김철수", 25);
Person p2 = new Person("김철수", 25);

Set<Person> people = new HashSet<>();
people.add(p1);
System.out.println(people.contains(p2)); // false 

// 원인: 다른 해시값으로 인해 다른 버킷에서 검색
p1.hashCode(); // 366712642 (메모리 주소 기반)
p2.hashCode(); // 1829164700 (다른 메모리 주소)
```

### equals를 재정의 하는 과정

```java
public class Person {
    private String name;
    private int age;
    
    // equals 메서드를 재정의 (Override)
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        Person person = (Person) obj;
        return age == person.age && Objects.equals(name, person.name);
    }
}
```

equals는 4단계의 검증을 거쳐 재정의 합니다. equals 메서드에 대해 정의하고 있는 자바 공식 API문서와 자주 사용되는 패턴을 참고했습니다.

1. 참조 동일성 (reflexive)
    - 같은 객체를 가리키면 true를 반환합니다.
2. null 및 타입 체크
    - null과 비교하거나 다른 클래스와 비교하는 경우 항상 false를 리턴합니다.
3. 타입 캐스팅
    - 자바에서 equals 메서드의 매개변수 타입이 Object 타입으로 정해져 있어
4. 실제 필드 값 비교
    - 필드의 실제 값을 비교합니다.

### hashCode의 재정의

`HashMap`, `HashSet`과 같은 해시기반 컬렉션을 사용할때 equals만 사용하게 되면 다른 값으로 인식이 되는 문제가 다시 발생합니다. hashCode를 재정의하는 이유는 논리적으로 같은 객체가 같은 해시값을 갖도록 하기 위해서 입니다.

HashMap을 사용하는 경우 내부 구현체를 보면 아래 조건분 구간에서 해시 값으로 배열 인덱스를 계산합니다. 같은 해시값인 경우 같은 배열 인덱스에 저장되게 되고 인덱스 내부에서 노드들이 연결리스트로 추가 되게 됩니다. hashCode를 먼저 결정하기 때문에 hashCode가 틀리면 equals 비교 전에 false를 return 합니다.

```java
// HashMap의 containsKey
public boolean containsKey(Object key) {
    return getNode(hash(key), key) != null;
}

// getNode
    final Node<K,V> getNode(int hash, Object key) {
        Node<K,V>[] tab; Node<K,V> first, e; int n; K k;
        if ((tab = table) != null && (n = tab.length) > 0 &&
            (first = tab[(n - 1) & hash]) != null) { // 해시 값으로 배열 인덱스 계산
            if (first.hash == hash && // hash 값 비교
                ((k = first.key) == key || (key != null && key.equals(k)))) // equals가 여기서 실행
                return first;
            if ((e = first.next) != null) {
                if (first instanceof TreeNode)
                    return ((TreeNode<K,V>)first).getTreeNode(hash, key);
                do {
                    if (e.hash == hash &&
                        ((k = e.key) == key || (key != null && key.equals(k))))
                        return e;
                } while ((e = e.next) != null);
            }
        }
        return null;
    }
```

### 정리

equals & hashCode는 자바의 Object 객체에 이미 존재하는 equals()와 hashCode() 메서드를 재정의해 Value Object에서 값이 같은 경우 같은 값으로 간주하는 개념이다.

참고자료:[Overriding and Hiding Methods](https://docs.oracle.com/javase/tutorial/java/IandI/override.html)

[Annotation Type Override](https://docs.oracle.com/javase/tutorial/java/IandI/override.html)

[java-equals-hashcode](https://www.digitalocean.com/community/tutorials/java-equals-hashcode)
