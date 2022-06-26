# Gated Check-in for AWS CodeCommit with AWS Step Functions
PS DevOps AoD artifact - Gated Check-in for AWS CodeCommit on Pull Request with AWS Step Functions
## Background

A gated commit or gated check-in is a software integration pattern that reduces the chances for breaking a build (and often its associated tests) by committing changes into the main branch of version control. This pattern can be supported by a continuous integration (CI) server.

However, if the customer wants to apply gated check-in to AWS CodeCommit based on a pull request, they will be required to manually configure and integrate AWS CodeBuild to enable automation tests such as a unit test, coverage test, etc. and they have to manually change approval status on the pull request based on test results. In addition, if the customer may also want to customize their build processes. Examples of customization include choosing to or not to run some tests or skip certain tasks when you need to deploy a quick fix. 


## Project Overview

The Following diagrams show the overall architecture and workflow detail for step functions.

![artifact-arch-Page-5](https://user-images.githubusercontent.com/47220755/175829211-3cd86934-8dca-4bce-a5e1-3e50890ebe37.jpg)

The following explanation is based on the architecture above. According to changes in the pull request status event on AWS CodeCommit, the event bridge rule filters the event and delivers the event to the target, which is AWS Lambda. When AWS Lambda receives the event, it checks the event if the customized build needed and then triggers AWS Step Functions for CI. When CI is finished, Step Functions updates the comment to the CI result on pull request and also updates pull request approval status based on the CI result.


![Detail-sfn](https://user-images.githubusercontent.com/47220755/175833302-d68fad9a-3bde-4ad1-a411-b915397d5a5c.png)

The Workflow consists of three parts:

1. CI Envirinment Creating
2. Run CI
3. Clean Up CI Environment



## Getting Started
This Solution was developed based on CDK(Cloud Developement Kit) to be easily reusable for any AWS environment.
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