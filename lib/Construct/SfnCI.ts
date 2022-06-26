import { Construct } from "constructs";
import { Duration, RemovalPolicy } from "aws-cdk-lib";

import { AccountPrincipal, Effect, IRole, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Rule } from "aws-cdk-lib/aws-events";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { CfnStateMachine, IStateMachine } from "aws-cdk-lib/aws-stepfunctions";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import * as ciWorkflow from "../../resources/StepFunctions/sfnCI.asl.json";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { Bucket, BucketAccessControl } from "aws-cdk-lib/aws-s3";
import { IKey } from "aws-cdk-lib/aws-kms";

interface sfnCIProps {
	ServiceName: string;
	RepoName: string;
	ServiceRoles: Record<string, IRole>;
	AccountId: string;
	EncryptionKey: IKey;
	AllowAccountIds: string[];
}

export class sfnCI extends Construct {
	public readonly pullRequestEventBridgeRule: Rule;
	public readonly parseCodebuildResultFunction: Function;
	public readonly sfnTriggerFunction: Function;
	public readonly stepFunctionWorkflow: CfnStateMachine;
	public readonly ciConfigParams: StringParameter[];
	public readonly ciSfnWorkflow: CfnStateMachine;
	public readonly stateMachine: IStateMachine;
	public readonly ciArtifactBucket: Bucket;

	constructor(scope: Construct, id: string, props: sfnCIProps) {
		super(scope, id);
		this.ciArtifactBucket = this.createCIS3Bucket(props);
		this.pullRequestEventBridgeRule = this.createPullRequestEvnetBridgeRule(props);
		this.parseCodebuildResultFunction = this.createParseCodebuildFunction(props);
		this.ciConfigParams = this.createCIConfigParams(props, this.ciArtifactBucket);
		this.ciSfnWorkflow = this.createSfnWorkflow(props);
		this.sfnTriggerFunction = this.createSfnTriggerFunction(props, this.ciSfnWorkflow.attrArn);
		this.pullRequestEventBridgeRule.addTarget(new LambdaFunction(this.sfnTriggerFunction));
	}
	//CI Artifact Bucket
	private createCIS3Bucket(props: sfnCIProps) {
		const bucket: Bucket = new Bucket(this, "CIS3Bucket", {
			bucketName: `${props.RepoName}-ci-bucket`,
			accessControl: BucketAccessControl.PRIVATE,
			versioned: true,
			encryptionKey: props.EncryptionKey,
			removalPolicy: RemovalPolicy.DESTROY,
			autoDeleteObjects: true
		});
		let principals: AccountPrincipal[] = [];
		for (const account of props.AllowAccountIds) {
			principals.push(new AccountPrincipal(account));
		}

		const allowPolicy = new PolicyStatement({
			resources: [bucket.arnForObjects("*")],
			actions: ["s3:List*", "s3:Get*", "s3:Put*"],
			principals: principals,
			effect: Effect.ALLOW
		});

		bucket.addToResourcePolicy(allowPolicy);
		return bucket;
	}

	//SSM Params
	private createCIConfigParams(props: sfnCIProps, artifactBucket: Bucket) {
		const params: StringParameter[] = [artifactBucket.bucketName, props.ServiceRoles["codebuild"].roleArn].map((paramName, index) => {
			const param: StringParameter = new StringParameter(this, `${props.RepoName}-ci-config-param-${index}`, {
				parameterName: paramName === artifactBucket.bucketName ? `/${props.RepoName}/codebuild/artifact-bucket` : `/${props.RepoName}/codebuild/role`,
				description: `CI Configuration Parameters for ${props.RepoName} Repo`,
				stringValue: paramName
			});
			return param;
		});
		return params;
	}

	// EventBrdige Rule
	private createPullRequestEvnetBridgeRule(props: sfnCIProps) {
		const rule = new Rule(this, "prEventBridgeRule", {
			eventPattern: {
				source: ["aws.codecommit"],
				detailType: ["CodeCommit Pull Request State Change"],
				detail: {
					event: ["pullRequestSourceBranchUpdated", "pullRequestCreated", "pullRequestStatusChanged", "pullRequestMergeStatusUpdated"]
				},
				resources: [`arn:aws:codecommit:ap-northeast-2:${props.AccountId}:${props.RepoName}`]
			}
		});
		return rule;
	}

	// Codebuild Parse Lambda Function
	private createParseCodebuildFunction(props: sfnCIProps) {
		const lambdaFunction = new Function(this, "codebuildResultParseFunc", {
			runtime: Runtime.NODEJS_14_X,
			handler: "parseCodebuildResult.handler",
			code: Code.fromAsset("resources/lambda_functions/parseCodeBuild"),
			timeout: Duration.minutes(1),
			functionName: `lambda-${props.RepoName}-codebuild-result-parser`,
			logRetention: RetentionDays.TWO_WEEKS,
			role: props.ServiceRoles["lambda"]
		});
		return lambdaFunction;
	}

	// Sfn Trigger Lambda Function
	private createSfnTriggerFunction(props: sfnCIProps, stepfunctionsArn: string) {
		const lambdaFunction = new Function(this, "sfnTriggerFunc", {
			runtime: Runtime.NODEJS_14_X,
			handler: "SfnTrigger.handler",
			code: Code.fromAsset("resources/lambda_functions/parseEvent"),
			timeout: Duration.minutes(1),
			functionName: `lambda-${props.RepoName}-sfn-trigger`,
			logRetention: RetentionDays.TWO_WEEKS,
			role: props.ServiceRoles["lambda"],
			environment: {
				SFN_ARN: stepfunctionsArn
			}
		});
		return lambdaFunction;
	}

	// Stepfunctions Workflow
	private createSfnWorkflow(props: sfnCIProps) {
		const sfnLogGroup = new LogGroup(this, `${props.RepoName}-log-group`, {
			logGroupName: `/aws/sfn/logGroup/${props.RepoName}`,
			removalPolicy: RemovalPolicy.DESTROY,
			retention: RetentionDays.TWO_WEEKS
		});
		const stateMachine = new CfnStateMachine(this, `${props.RepoName}-CI-Workflow`, {
			definitionString: JSON.stringify(ciWorkflow),
			roleArn: props.ServiceRoles["sfn"].roleArn,
			stateMachineName: `${props.RepoName}-ci-sfn-workflow`,
			loggingConfiguration: {
				destinations: [
					{
						cloudWatchLogsLogGroup: {
							logGroupArn: sfnLogGroup.logGroupArn
						}
					}
				],
				level: "ALL",
				includeExecutionData: true
			}
		});
		return stateMachine;
	}
}
