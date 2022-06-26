# Gated Check-in for AWS CodeCommit with AWS Step Functions

## Background

A gated commit or gated check-in is a software integration pattern that reduces the chances for breaking a build (and often its associated tests) by committing changes into the main branch of version control. This pattern can be supported by a continuous integration (CI) server.

However, if the customer want to apply gated check-in to AWS CodeCommit based on pull request, it is required that they have to manually configure and integrate AWS CodeBuild to enable the automation test like unit test, coverage test and etc as well as they have to manually change approval status on pull request based on test result. In addition to them, the customer also want to customize their build processes. For example, they may want to run, or not, some tests, or skip some task when you need to deploy a quick fix. 


## Project Overview

The Following diagrams show the overall architecture and workflow detail for step functions.

![artifact-arch-Page-5](https://user-images.githubusercontent.com/47220755/175829211-3cd86934-8dca-4bce-a5e1-3e50890ebe37.jpg)

Based on the overall architecture above, depending on pull request status change  event on AWS CodeCommit event bridge rule filter the event and deliver event to target as  AWS Lambda. when Lambda received the event, it parse the event and then trigger AWS Stepfunctions for CI. when CI finished, Step Functions update CI result to Pull Request on comment and pull request approval status based on CI result.


![Detail-sfn](https://user-images.githubusercontent.com/47220755/175833302-d68fad9a-3bde-4ad1-a411-b915397d5a5c.png)

The Workflow is consist of three parts

1. CI Envirinment Creating 
2. Run CI
3. Clean Up CI Environment



## Getting Started
This Soltuon was developed based on CDK so it is easily reusable for any AWS environment.
### Prerequisites
CDK V2
AWS CLI



### How to Deploy


## Example Usage

## Future Improvements

## Clean Up
```
 $ cdk destroy
```