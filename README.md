# Gated Check-in for AWS CodeCommit using AWS Step Functions
PS DevOps AoD artifact - Gated Check-in for AWS CodeCommit using AWS Step Functions with customized build and test on Pull Request
## Background

A gated commit or gated check-in is a software integration pattern that reduces the chances for breaking a build (and often its associated tests) by committing changes into the main branch of version control. This pattern can be supported by a continuous integration (CI) server.

However, if the customer wants to apply gated check-in to AWS CodeCommit based on a pull request, they will be required to manually configure and integrate AWS CodeBuild to enable automation tests such as a unit test, coverage test, etc. and they have to manually change approval status on the pull request based on test results. In addition, this may be done if the customer may also want to customize their build processes. Examples of customization include choosing to or not to run some tests or skip certain tasks when you need to deploy a quick fix. 


## Project Overview

The diagrams below show the overall architecture and workflow detail for step functions.

![artifact-arch-Page-5](https://user-images.githubusercontent.com/47220755/175829211-3cd86934-8dca-4bce-a5e1-3e50890ebe37.jpg)

The following explanation is based on the architecture above. According to changes in the pull request status event on AWS CodeCommit, the event bridge rule filters the event and delivers the event to the target, which is AWS Lambda. When AWS Lambda receives the event, it checks the event if the customized build needed and then triggers AWS Step Functions for CI(Continuous Integration). When CI is finished, Step Functions updates the comment to the CI result on pull request and also updates pull request approval status based on the CI result.


![Detail-sfn](https://user-images.githubusercontent.com/47220755/175833302-d68fad9a-3bde-4ad1-a411-b915397d5a5c.png)

Following the lifecycle of pull request on CodeCommit repository, Step Functions manages creating, running and deleting build and test environment for CI and its workflow consists of three parts:

1) Create CI Environment

     When pull request is created, it is filtered to stage the creation of the CI environment. Then it Retrieves configuration values such as artifact bucket name and service role arn for CodeBuild from parameter store. Configuration values are used by step functions to manage the creation of CodeBuild Project whenrequired container build is based on pull request title. After creating CodeBuild Project, it manages to put CodeBuild Badge Url to parameter store.

2) Build And Test Application on CI Environment

     After creating the CI environment or when pull request is updated, Step Functions manages to trigger the CodeBuild for building and testing application. Every 10 seconds it checks the build status and if it is not completed, it will repeat the process until it is completed. When the build status is completed, it triggers the lambda function to parse the CodeBuild result. Based on CodeBuid result Step Functions, it posts a comment for test result summary to pull request and updates pull request approval status.
     
3) Delete CI Environment

     When pull request is merged it will meet the approval rule or may be closed for some reason. Step Functions manages to clean up the CI enviroment which was created when pull request was created. 


## Getting Started
This Solution was developed based on CDK(Cloud Developement Kit) and it is easily reusable for any AWS environment.

### Prerequisites
1. Configure AWS credential and AWS region 

     > check [configure aws cli](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html#cli-configure-files-methods) and run `aws sts get-caller-identity` to validate it
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

> Make sure `/example/application_repository` size under 20MB

When CDK App is deployed, you have to manually create approval rule template and associate CodeCommit Repository on CodeCommit console.

<img width="818" alt="image" src="https://user-images.githubusercontent.com/47220755/176768558-763ff9a5-96f2-49be-90b6-01a9701a46b6.png">

> CDK is not currently supported to create approval rule template.

## Example Usage
You can create branch from main branch on CodeCommit to test the workflow.

<img width="1126" alt="image" src="https://user-images.githubusercontent.com/47220755/176768876-b9d380a1-eb6d-4bd6-aaaa-acbb8fb0ff99.png">

For creating pull request, add a new commit on branch you've created

<img width="1111" alt="image" src="https://user-images.githubusercontent.com/47220755/176770350-3327517c-5aca-4933-a7ab-84f32ce24d1f.png">

After new commit on branch, create the pull request

<img width="1158" alt="image" src="https://user-images.githubusercontent.com/47220755/176770952-abdca224-201f-4b6d-b1fb-5059eed1e133.png">

There are two option for custom build. if you want to build container image and push to ECR, you should include the following word on pull request title `@ContainerBuild` otherwise it will integrate with unit and coverage test.


- Case1) Pull request title includes `@ContainerBuild`

     <img width="1140" alt="image" src="https://user-images.githubusercontent.com/47220755/176770766-462e2612-db21-4721-af98-09fcd0ceae23.png">


- Case2) Pull request title doesn't include `@ContainerBuild`

     <img width="1127" alt="image" src="https://user-images.githubusercontent.com/47220755/176770572-9c69323f-fb37-4740-bfd1-c006e8c66ba2.png">     

Step Functions is triggered by pull request created event.

- Case1) Pull request title includes `@ContainerBuild`

     <img width="1169" alt="image" src="https://user-images.githubusercontent.com/47220755/176771611-c778ec3c-c96b-45a2-9a01-a313426bc222.png">


- Case2) Pull request title doesn't include `@ContainerBuild`

     <img width="1154" alt="image" src="https://user-images.githubusercontent.com/47220755/176771653-bff56c20-f3b1-4104-a747-ff7f1d19b77a.png">


When Step Functions workflow is completed, the approval status and comment on pull request is upated.

- Case1) Pull request title includes `@ContainerBuild`

     <img width="1125" alt="image" src="https://user-images.githubusercontent.com/47220755/176771771-cad78a68-d830-4fa0-ac16-f6afd393cc2b.png">


- Case2) Pull request title doesn't include `@ContainerBuild`

     <img width="1135" alt="image" src="https://user-images.githubusercontent.com/47220755/176771837-3f637bd4-de91-470e-9c6f-1f77de0b8054.png">

     You also can check CodeBuild Report as well

     <img width="1088" alt="image" src="https://user-images.githubusercontent.com/47220755/176772057-88ca50a2-e99e-4d7e-96cf-a2576f4ae4a4.png">
     <img width="1119" alt="image" src="https://user-images.githubusercontent.com/47220755/176772081-323cd995-50f5-4f27-bf97-05dd09c302cb.png">



When pull request is merged  or closed, Step Functions is triggered to delete the CI environment

<img width="1143" alt="image" src="https://user-images.githubusercontent.com/47220755/176772266-ea1c4744-eabc-4cdb-9a41-ac94eeb91947.png">
<img width="1149" alt="image" src="https://user-images.githubusercontent.com/47220755/176772339-ca98348b-e1e0-4bbd-98cd-08ed219181fa.png">


## Clean Up
Make sure ECR repository has emptied then run following command
```bash
# destroy the cdk stack
 $ cdk destroy
```

## Wrap Up
AWS Stepfunctions provides the functionality to automatically configure the gated check-in for AWS Codecommit based on pull request life cycle. Furthermore, If you want to have your own customized build, you can update `resources/lambda_functions/parseEvent/SfnTrigger.js` function to parse the keyword that you want to customize on pull request title and update `resources/StepFunctions/sfnCI.asl.json` for validating choice before the creating CodeBuild project state. Lastly, writing your own build script under `build_scripts` directory on your repository. 
