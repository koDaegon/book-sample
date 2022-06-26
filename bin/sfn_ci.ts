#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { SfnCiStack } from "../lib/sfn_ci-stack";

const app = new cdk.App();

const devops_account = app.node.tryGetContext("devops_account") || "681291798978";

new SfnCiStack(app, "SfnCiStack", {
	ServiceName: "icn",
	DevOpsAccountId: devops_account,
	RepoName: "example-java-repo"
});
