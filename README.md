# Sample CRUD JAVA Application

## Implement local secret scanning

### Background
일반적으로 어플리케이션 개발시 DB 혹은 다른 AWS 서비스 혹은 3rd Party 시스템 들과 연동하여 개발을 진행해야 할 경우가 있습니다. 주로 Credential을 통한 인증을 거치게 되는데 다양한 방법으로 Credential을 설정 할 수 있습니다. 이때 주로 사용되는 Credential으로는 AWS Access Key, Secret Access Key, DB Access Endpoint ,Username, Password, API keys 및 tokens 등이 있습니다. 해당 Credential들이 Github과 같은 버전관리 툴에 업로드 되면 해킹 공격에 표적이 되어 보안에 매우 취약 하기 때문에 사전에 이를 조치할 수 있어야 합니다.



### Install Secret Scanning tool
[링크](https://github.com/Yelp/detect-secrets)를 통해 Secret Scanning 도구를 설치하고 baseline 파일을 설정 합니다.



**Install**
```bash
 $ pip install detect-secrets

 # OR

 $ brew install detect-secrets
```


**Baseline Setup**
버전 확인을 통해 설치 확인 후 baseline 파일을 통해 어플리케이션상의 암호 및 자격증명의 바운더리를 설정할 수 있습니다.
```bash
$ detect-secrets --version
$ detect-secrets scan > .secrets.baseline
```




### Build Application
`build.gradle` 파일을 확인한 후 어플리케이션을 로컬에서 빌드하여 어플리케이션을 실행 합니다.
```bash
# Mac OS or Linux
$ make docker-run

# Windows
$ gradlew clean build -x test
$ docker build -t book-sample:latest .
$ docker run -p 8080:8080  --name sample-app  --rm book-sample:latest
```
어플리케이션이 정상적으로 실행되었다면 아래 주소를 통해 swagger-ui 화면을 확인 할 수 있습니다.
```
http://localhost:8080/swagger-ui/index.html
```
<img width="1179" alt="image" src="https://user-images.githubusercontent.com/47220755/218373024-0b8975d0-8337-4ac3-aebd-7cc2ab335eb7.png">



### Pre-Commit Test 
[Git Hooks](https://git-scm.com/book/ko/v2/Git%EB%A7%9E%EC%B6%A4-Git-Hooks) 기능을 통해 매 commit 시 마다 scanning 도구를 이용해 baseline과 달라진 value를 발견한다면 로컬 환경에서 commit을 제한 시키고 더 빠르게 보안 위협을 해소 시킬 수 있게 합니다.
<img width="855" alt="image" src="https://user-images.githubusercontent.com/47220755/218372647-7c8c9937-4bce-43a8-8ab7-5d31b0c8a23a.png">
