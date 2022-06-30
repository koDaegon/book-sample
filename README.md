# Customized Gated Check-in for AWS CodeCommit with AWS Step Functions
PS DevOps AoD artifact - Customized Gated Check-in for AWS CodeCommit on Pull Request with AWS Step Functions
## Background

A gated commit or gated check-in is a software integration pattern that reduces the chances for breaking a build (and often its associated tests) by committing changes into the main branch of version control. This pattern can be supported by a continuous integration (CI) server.

However, if the customer wants to apply gated check-in to AWS CodeCommit based on a pull request, they will be required to manually configure and integrate AWS CodeBuild to enable automation tests such as a unit test, coverage test, etc. and they have to manually change approval status on the pull request based on test results. In addition, if the customer may also want to customize their build processes. Examples of customization include choosing to or not to run some tests or skip certain tasks when you need to deploy a quick fix. 


## Project Overview

The diagrams below show the overall architecture and workflow detail for step functions.

![artifact-arch-Page-5](https://user-images.githubusercontent.com/47220755/175829211-3cd86934-8dca-4bce-a5e1-3e50890ebe37.jpg)

The following explanation is based on the architecture above. According to changes in the pull request status event on AWS CodeCommit, the event bridge rule filters the event and delivers the event to the target, which is AWS Lambda. When AWS Lambda receives the event, it checks the event if the customized build needed and then triggers AWS Step Functions for CI(Continuous Integration). When CI is finished, Step Functions updates the comment to the CI result on pull request and also updates pull request approval status based on the CI result.


![Detail-sfn](https://user-images.githubusercontent.com/47220755/175833302-d68fad9a-3bde-4ad1-a411-b915397d5a5c.png)

Following the lifecycle of pull request on CodeCommit repository, Step Functions manages creating, running and deleteing build and test environment for CI and its workflow consists of three parts:

1) Create CI Environment

     When pull request is created It is filtered to stage for creating the CI environment. Getting configuration values such as artifact bucket name and service role arn for CodeBuild from parameter store. Using configuration values step functiuons manage to create CodeBuild Project whether it is required container build based on pull request title. After creating CodeBuild Project, it manages to put CodeBuild Badge Url to parameter store.

2) Build And Test Application on CI Environment

     After creating the CI environment or when pull request is updated, Step Functions manages to trigger the CodeBuild for building and testing application. every 10 seconds it checks the build status and if it is not completed, it will repeat the process till it is completed. When the build status is completed, it triggers the lambda function to parse the CodeBuild result. Based on CodeBuid result Step Functions posts a comment for test result summary to pull request and updates pull request approval status.
     
3) Delete CI Environment

     When pull request is merged meeting the approval rule or is closed for some reason. Step Functions manages to clean up the CI enviroment which was created when pull request was created. 


## Getting Started
This Solution was developed based on CDK(Cloud Developement Kit) and it is easily reusable for any AWS environment.

### Prerequisites
1. Configure AWS credential and AWS region 
2. Set up AWS CDK version 2 

     >  check [install AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_install) and run `cdk --version` to validate the version
3. Bootstrap with AWS account

     > check [bootstap AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_bootstrap) page for details

### How to Deploy
Configure the values for stack in `cdk.json`
```json
{
     "context": {
		"accountId": "<Account_ID>",
		"sericeName": "<Service_Name>",
		"repositoryName": "<Repository_Name>"
	}
}
```

Deploy the cdk app with following commands after cdk bootstap

```bash
$ git clone https://gitlab.aws.dev/kdaegon/gated-check-in-for-aws-codecommit.git
# install required packages
$ npm install
# check the diff before deployment
$ cdk diff
# deploy the complete stack
$ cdk deploy
```


## Example Usage


## Clean Up
Make sure ECR repository has empty and run following command
```bash
# destroy the cdk stack
 $ cdk destroy
```

## Future Improvements
### Container image vunerabiliy check with build
### Support other lagagues