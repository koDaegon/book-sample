# Express Sample App 을 활용한 EKS CICD Hands-On

## 실습 순서
0. 클러스터 및 실습 환경 셋업
1. AWS Native 서비스fmf 이용한 CI/CD 파이프라인 구축
2. Helm/ArgoCD를 활용한 GitOps 구축
3. Trivy를 활용한 컨테이너 이미지 취약점 테스트 추가 구성

## 실습 아키텍처

### Code Series를 활용한 CI/CD
![eks-cicd-codebuild-arch](https://user-images.githubusercontent.com/47220755/153075744-08a278fa-8c38-4864-af7b-191cfc1f2f7b.jpg)



### ArgoCD를 활용한 GitOps
![argo-cd](https://user-images.githubusercontent.com/47220755/153104957-9123d6a0-c6a6-4500-b1b6-537bf1308e40.jpg)

### Trivy를 활용한 컨테이너 이미지 취약점 검사 자동화
![add-trivy]


## 실습 환경 세팅

### Cloud9 Workspace 생성

- Console에 접속하여 Cloud9 workspace 생성


### 실습에 필요한 툴 설치

- kubectl 설치
    
    ```bash
    sudo curl --silent --location -o /usr/local/bin/kubectl \
       https://amazon-eks.s3.us-west-2.amazonaws.com/1.19.6/2021-01-05/bin/linux/amd64/kubectl
    
    sudo chmod +x /usr/local/bin/kubectl
    kubectl version --short
    ```
    
- awscli 업데이트
    
    ```bash
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    sudo ./aws/install
    aws --version
    ```
    
- jq 설치
    
    ```bash
    sudo yum -y install jq gettext bash-completion moreutils
    ```
    
- kubectl 자동완성 설정
    
    ```bash
    kubectl completion bash >>  ~/.bash_completion
    . /etc/profile.d/bash_completion.sh
    . ~/.bash_completion
    ```
    
- brew 설치
    
    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    #After install
    #test -d ~/.linuxbrew && eval "$(~/.linuxbrew/bin/brew shellenv)"
    #test -d /home/linuxbrew/.linuxbrew && eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    #test -r ~/.bash_profile && echo "eval \"\$($(brew --prefix)/bin/brew shellenv)\"" >>~/.bash_profile
    #echo "eval \"\$($(brew --prefix)/bin/brew shellenv)\"" >>~/.profile
    ```
    
- K9S 설치(Optional)
    
    ```bash
    brew install derailed/k9s/k9s
    ```
    
- helm 설치
    
    ```bash
    brew install helm
    # curl -sSL https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash
    ```
    
- eksctl 설치
    
    ```json
    curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
    
    sudo mv -v /tmp/eksctl /usr/local/bin
    ```
    
- eksctl 자동완성 설정
    
    ```bash
    eksctl completion bash >> ~/.bash_completion
    . /etc/profile.d/bash_completion.sh
    . ~/.bash_completion
    ```
    

### Cloud9 IAM role mapping

- Admin role로  Cloud9 instance IAM 역할 수정
- 임시 자격증명 비활성화
    
    > Cloud9에 임시로 매핑된 임시 자격증명이 아니라 매핑한 롤을 Cloud9의 자격 증명으로 사용하기 위해 임시로 매핑된 자격증명을 비활성화해야 함.
    > 
    
    ```bash
    aws cloud9 update-environment  --environment-id $C9_PID --managed-credentials-action DISABLE
    rm -vf ${HOME}/.aws/credentials
    ```
    
- IAM Role 확인
    
    ```bash
    aws sts get-caller-identity
    ```
    
- Account ID, Region 설정
    
    ```bash
    export ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
    export AWS_REGION=$(curl -s 169.254.169.254/latest/dynamic/instance-identity/document | jq -r '.region')
    export AZS=($(aws ec2 describe-availability-zones --query 'AvailabilityZones[].ZoneName' --output text --region $AWS_REGION))
    
    ```
    

- Bash profile 저장
    
    ```bash
    echo "export ACCOUNT_ID=${ACCOUNT_ID}" | tee -a ~/.bash_profile
    echo "export AWS_REGION=${AWS_REGION}" | tee -a ~/.bash_profile
    echo "export AZS=(${AZS[@]})" | tee -a ~/.bash_profile
    aws configure set default.region ${AWS_REGION}
    aws configure get default.region
    ```
    

### EKS Cluster 생성

- Copy cluster yaml file
    
    ```bash
    ---
    apiVersion: eksctl.io/v1alpha5
    kind: ClusterConfig
    
    metadata:
      name: <Cluster-Name>
      region: ap-northeast-2
      version: "1.20"
    
    vpc:
      subnets:
        private:
          ap-northeast-2a: { id: <Private-Subnet-id-1> }
          ap-northeast-2b: { id: <Private-Subnet-id-2> }
    
    managedNodeGroups:
    - name: nodegroup
      desiredCapacity: 2
      instanceType: m5.large
      privateNetworking: true
      ssh:
        enableSsm: true
      iam:
          withAddonPolicies:
            autoScaler: true
            externalDNS: true
            certManager: true
            albIngress: true
            cloudWatch: true
    ```
    
- create cluster with eksctl
    
    ```bash
    eksctl create cluster -f cluster.yaml
    ```
    
- test the cluster
    
    ```bash
    kubectl get nodes
    ```
    

### AWS Load Balancer Controller 생성

- IAM OIDC 생성
    - Service account에 iam role 을 사용하기 위해 IAM OIDC provider를 생성해야함
    
    ```bash
    eksctl utils associate-iam-oidc-provider \
    --region ${AWS_REGION} \
    --cluster ${CLUSTER_NAME} \
    --approve
    ```
    
    - 확인
    
    ```bash
    aws eks describe-cluster --name ${CLUSTER_NAME} --query "cluster.identity.oidc.issuer" --output text
    ```
    

- Service Account IAM policy 생성
    
    ```yaml
    curl -o iam_policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.3.0/docs/install/iam_policy.json
    aws iam create-policy \
        --policy-name AWSLoadBalancerControllerIAMPolicy \
        --policy-document file://iam_policy.json
    ```
    
- Service Account 생성 for LB Controller
    
    ```yaml
    eksctl create iamserviceaccount \
        --cluster ${CLUSTER_NAME} \
        --namespace kube-system \
        --name aws-load-balancer-controller \
        --attach-policy-arn arn:aws:iam::$ACCOUNT_ID:policy/AWSLoadBalancerControllerIAMPolicy \
        --override-existing-serviceaccounts \
        --approve
    ```
    

- TargetGroupBinging CRDs 설치
[https://kubernetes-sigs.github.io/aws-load-balancer-controller/v2.3/guide/targetgroupbinding/targetgroupbinding/](https://kubernetes-sigs.github.io/aws-load-balancer-controller/v2.3/guide/targetgroupbinding/targetgroupbinding/)
    
    ```yaml
    kubectl apply -k github.com/aws/eks-charts/stable/aws-load-balancer-controller/crds?ref=master
    
    kubectl get crd
    ```
    

- EKS repo 를 helm에 추가
    
    ```yaml
    helm repo add eks https://aws.github.io/eks-charts
    ```
    

- Service Account를 이용하여 aws-load-balancer-controller 설치

```bash
helm upgrade -i aws-load-balancer-controller \
    eks/aws-load-balancer-controller \
    -n kube-system \
    --set clusterName=${CLUSTER_NAME} \
    --set serviceAccount.create=false \
    --set serviceAccount.name=aws-load-balancer-controller \
    --set image.tag="v2.3.0"

kubectl -n kube-system rollout status deployment aws-load-balancer-controller
```

- Sample App 배포 (Optional)

```bash
---
apiVersion: v1
kind: Namespace
metadata:
  name: game-2048
---
apiVersion: apps/v1
kind: Deployment
metadata:
  namespace: game-2048
  name: deployment-2048
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: app-2048
  replicas: 2
  template:
    metadata:
      labels:
        app.kubernetes.io/name: app-2048
    spec:
      containers:
      - image: public.ecr.aws/l6m2t8p7/docker-2048:latest
        imagePullPolicy: Always
        name: app-2048
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  namespace: game-2048
  name: service-2048
spec:
  ports:
    - port: 80
      targetPort: 80
      protocol: TCP
  type: NodePort
  selector:
    app.kubernetes.io/name: app-2048
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  namespace: game-2048
  name: ingress-2048
  annotations:
    alb.ingress.kubernetes.io/ip-address-type: ipv4
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP":80}]'
    alb.ingress.kubernetes.io/load-balancer-attributes: idle_timeout.timeout_seconds=60
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/subnets: <public_subnet_id_1>, <public_subnet_id_2>
    alb.ingress.kubernetes.io/target-group-attributes: deregistration_delay.timeout_seconds=30
    alb.ingress.kubernetes.io/target-type: ip
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/backend-protocol: HTTP
spec:
  rules:
    - http:
        paths:
        - path: /
          pathType: Prefix
          backend:
            service:
              name: service-2048
              port:
                number: 80
```

- 위의 파일을 복사 한 후 원하는 파일명으로 워크스페이스에 생성
- subnet id를 public subnet 으로 치환
- sample app 배포
    
    ```bash
    kubectl apply -f <filename>.yaml
    ```
### ArgoCD 설정
  1. Argocd 설치 & 네임스페이스 생성
      
      ```yaml
      kubectl create namespace argocd
      kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/v2.0.4/manifests/install.yaml
      ```
        
  2. Argocd cli 설치
      
      ```yaml
      sudo curl --silent --location -o /usr/local/bin/argocd https://github.com/argoproj/argo-cd/releases/download/v2.0.4/argocd-linux-amd64
      
      sudo chmod +x /usr/local/bin/argocd
      ```
        
  3. argocd-server expose
      
      ```yaml
      kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "LoadBalancer"}}'
      ```
       
      
      ```yaml
      export ARGOCD_SERVER=`kubectl get svc argocd-server -n argocd -o json | jq --raw-output '.status.loadBalancer.ingress[0].hostname'`
      ```
        
  4. Retrieve initial pwd for argoCD
      
      ```yaml
      export ARGO_PWD=`kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d`
      ```
        
  5. ArgoCD 로그인
      
      ```yaml
      argocd login $ARGOCD_SERVER --username admin --password $ARGO_PWD --insecure
      ```
        
  6. ArgoCD admin pw 변경
      
      ```yaml
      argocd account update-password --account admin
      ```
        