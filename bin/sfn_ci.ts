#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { SfnCiStack } from "../lib/sfn_ci-stack";

const app = new cdk.App();

new SfnCiStack(app, "SfnCiStack", {
	ServiceName: app.node.tryGetContext("serviceName"),
	AccountId: app.node.tryGetContext("accountId"),
	RepoName: app.node.tryGetContext("repositoryName")
});
