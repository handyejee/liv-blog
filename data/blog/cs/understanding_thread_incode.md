---
title: 스레드를 이해하기
date: '2025-09-13'
tags: ['CS', '운영체제']
draft: false
summary: 스레드를 
---

<aside>
핵심질문 1: 스레드란 무엇인가 ?   
핵심질문 2: 멀티 프로세스와 멀티 스레드로 실행하는 것의 차이?
</aside>

### 스레드 개념

- 스레드는 프로세스를 구성하는 실행의 흐름 단위
- 단일 스레드 프로세스 : 프로세스가 하나의 실행 흐름을 가지고 한번에 하나의 부분만 실행
- 스레드의 도입으로 프로세스를 구성하는 여러 명령어를 동시에 실행할 수 있게 되었다
- 프로세스와 다르게 스레드는 프로세스의 메모리영역을 공유한다

### 같은 작업을 더 효율적으로: 스레드를 사용하는 이유

프로세스로 작업을 할 수 있는데 스레드를 사용하는 이유는 무엇일까요 ? 프로세스와 스레드, 뒤에서 살펴볼 싱글 스레드와 멀티스레드에서 모두 3개의 파일을 다운로드하는 예제를 통해서 살펴보겠습니다.

1. 프로세스 생성
    프로세스는 각각 독립된 메모리 공간을 할당합니다. fork() 시스템 호출로 동일한 프로세스를 여러개 만드는 방식으로 생성되는데, 이 때 중복되는 정적영역이 생깁니다. 또한 프로세스 간 통신을 할 경우 IPC(프로세스 간 통신)을 사용합니다. 그렇기 때문에 프로세스는 무겁고 비효율적인 부분이 생깁니다. 하지만 프로세스 간 독립적이기 때문에 안정적입니다. 
2. 스레드 생성
    스레드를 사용할 경우 하나의 프로세스 내에서 메모리를 공유합니다. 프로세스 안에서 공유 가능한 영역을 공유하고 스레드를 여러개 사용해 작업을 더 빠르고 효율적으로 수행할 수 있게합니다. 같은 프로세스 내에서 스택만 변경하므로 상대적으로 컨텍스트 스위칭 비용이 저렴합니다.

### 싱글 스레드와 멀티 스레드

싱글 스레드는 한번에 하나의 작업을 순차적으로 처리하는 반면 멀티스레드는 동시에 여러 작업을 함께 처리합니다.  3개의 파일을 다운로드 받는 예시코드를 통해 싱글 스레드 환경과 멀티 스레드 환경에서 어떻게 실행되는지 확인해보겠습니다. 

싱글스레드 방식에서 코드를 실행하면 한개의 파일이 먼저 다운로드 - 작업 완료의 과정을 마치고 다음 파일 다운로드로 넘어가는 방식으로 하나씩 순차적으로 실행합니다.

```java
class SingleThread {
    public static void main(String[] args) {
        System.out.println("=== 싱글 스레드 방식 ===");

        // 작업 1: 파일 다운로드 시뮬레이션
        downloadFile("파일1.zip");
        downloadFile("파일2.zip");
        downloadFile("파일3.zip");

        System.out.println("모든 작업 완료!");
    }

    static void downloadFile(String fileName) {
        System.out.println(fileName + " 다운로드 시작...");
        try {
            Thread.sleep(2000); // 2초 대기 (다운로드 시뮬레이션)
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println(fileName + " 다운로드 완료!");
    }
}
```

```text
=== 싱글 스레드 방식 ===
파일1.zip 다운로드 시작...
파일1.zip 다운로드 완료!
파일2.zip 다운로드 시작...
파일2.zip 다운로드 완료!
파일3.zip 다운로드 시작...
파일3.zip 다운로드 완료!
모든 작업 완료!
```

반면 멀티스레드 방식에서 동일하게 파일 3개 다운로드를 실행하면 3개의 스레드가 동시에 실행되면서 파일 다운로드 시작 - 다운로드 완료 과정이 함께 실행됩니다. 멀티 스레드 환경에서 실행 순서는 운영체제가 결정합니다. 따라서 순서를 보장하지는 않는 특성이 있습니다.

```java
class MultiThread {
    public static void main(String[] args) {
        System.out.println("=== 멀티 스레드 방식 (Thread 상속) ===");

        // 3개의 스레드로 동시에 파일 다운로드
        DownloadThread thread1 = new DownloadThread("파일1.zip");
        DownloadThread thread2 = new DownloadThread("파일2.zip");
        DownloadThread thread3 = new DownloadThread("파일3.zip");

        // 스레드 시작
        thread1.start();
        thread2.start();
        thread3.start();

        // 모든 스레드가 끝날 때까지 기다림
        try {
            thread1.join();
            thread2.join();
            thread3.join();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        System.out.println("모든 다운로드 완료!");
    }
}

class DownloadThread extends Thread {
    private String fileName;

    public DownloadThread(String fileName) {
        this.fileName = fileName;
    }

    @Override
    public void run() {
        System.out.println("[스레드 " + Thread.currentThread().getId() + "] "
                + fileName + " 다운로드 시작...");
        try {
            Thread.sleep(2000); // 2초 대기
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println("[스레드 " + Thread.currentThread().getId() + "] "
                + fileName + " 다운로드 완료!");
    }
}
```

```text
=== 멀티 스레드 방식 (Thread 상속) ===
[스레드 11] 파일1.zip 다운로드 시작...
[스레드 13] 파일3.zip 다운로드 시작...
[스레드 12] 파일2.zip 다운로드 시작...
[스레드 12] 파일2.zip 다운로드 완료!
[스레드 11] 파일1.zip 다운로드 완료!
[스레드 13] 파일3.zip 다운로드 완료!
모든 다운로드 완료!
```

### 멀티 프로세스와 멀티 스레드로 실행하는건 뭐가 다를까 ?

같은 작업을 수행하는 동일한 프로세스를 두개 실행하는 것과 하나의 프로세스에서 두개의 스레드를 만든다고 할 때 결과는 동일합니다. “hi summer!”가 두번 출력 되는 결과는 동일하지만 내부동작에는 차이가 있습니다.

동일한 작업을 수행하는 프로세스가 있을 때 fork 를 통해서 실행하면 고유한 값을 제외한 내부의 값이 동일한 프로세스가 두개 생성됩니다. 중복된 내용이 메모리에 계속해서 적재됩니다. 스레드는 프로세스가 가지고 있는 자원을 공유하기 때문에 메모리 사용에 있어 효율적입니다.

<img src="/static/images/project/multi_process.png" alt="multi-process" width="300" height="400"/>

### 멀티스레드 환경에서 발생하는 이슈

멀티스레드 환경에서 공유하는 자원에 두개 이상의 스레드가 같은 데이터를 동시에 접근할 때 동시성 이슈가 발생할 수 있습니다. 스레드들이 독립적으로 실행되면서 같은 메모리 공간을 공유하기 때문에 발생할 수 있습니다.

### 참고자료

[혼자 공부하는 컴퓨터 구조 + 운영체제](https://product.kyobobook.co.kr/detail/S000061584886)   

[쉽게 배우는 운영체제](https://product.kyobobook.co.kr/detail/S000217098802)   

[Processes and Threads](https://docs.oracle.com/javase/tutorial/essential/concurrency/procthread.html)