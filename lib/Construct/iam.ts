import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import { Key } from "aws-cdk-lib/aws-kms";
import { Repository } from "aws-cdk-lib/aws-ecr";
import { IKey } from "aws-cdk-lib/aws-kms";
import { CompositePrincipal, Effect, Role, ServicePrincipal, PolicyStatement, ManagedPolicy } from "aws-cdk-lib/aws-iam";

interface IamProps {
	ServiceName: string;
	KmsCmk?: IKey;
	EcrRepo?: Repository;
}

export class Iam extends Construct {
	public readonly codebuildRole: Role;
	public readonly lambdaRole: Role;
	public readonly sfnRole: Role;

	constructor(scope: Construct, id: string, props: IamProps) {
		super(scope, id);

		this.codebuildRole = this.createCodebuildRole();
		this.sfnRole = this.createSfnRole();
		this.lambdaRole = this.createLambdaRole();

		this.addLoggingPolicy(this.codebuildRole);
		this.addCodebuildPolicy(this.codebuildRole);
		this.addCdkAssumePolicy(this.codebuildRole);

		if (props.KmsCmk) {
			this.addKmsPolicy(this.codebuildRole, props.KmsCmk);
		}

		if (props.EcrRepo) {
			this.addEcrAuthPolicy(this.codebuildRole);
			this.addEcrPullPushPolicy(this.codebuildRole, props.EcrRepo);
		}

		this.sfnRole.addManagedPolicy(ManagedPolicy.fromManagedPolicyArn(this, "sfnFull", "arn:aws:iam::aws:policy/AWSStepFunctionsFullAccess"));
		this.sfnRole.addManagedPolicy(ManagedPolicy.fromManagedPolicyArn(this, "logsFull", "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"));
		this.sfnRole.addToPolicy(
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: [
					"states:*",
					"iam:PassRole",
					"ssm:PutParameter",
					"ssm:GetParameterHistory",
					"ssm:DescribeDocumentParameters",
					"ssm:GetParametersByPath",
					"ssm:GetParameters",
					"ssm:GetParameter",
					"ssm:DeleteParameter",
					"codebuild:*",
					"lambda:InvokeFunction",
					"lambda:ListFunctions",
					"codecommit:*",
					"sns:Publish",
					"logs:*"
				],
				resources: ["*"]
			})
		);

		this.lambdaRole.addToPolicy(
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: [
					"ssm:PutParameter",
					"ssm:GetParameters",
					"ssm:GetParameter",
					"codebuild:BatchGetBuilds",
					"codebuild:BatchGetReports",
					"codecommit:GetCommit",
					"lambda:InvokeFunction",
					"states:StartExecution",
					"logs:CreateLogStream",
					"logs:PutLogEvents",
					"logs:DescribeLogGroups"
				],
				resources: ["*"]
			})
		);
		this.lambdaRole.addManagedPolicy(
			ManagedPolicy.fromManagedPolicyArn(this, "lambdaCodecommitIntgPermission", "arn:aws:iam::aws:policy/AWSCodeCommitPowerUser")
		);

		this.codebuildRole.addManagedPolicy(
			ManagedPolicy.fromManagedPolicyArn(this, "codebuildAdmin", "arn:aws:iam::aws:policy/AWSCodeBuildAdminAccess")
		);

		this.codebuildRole.addManagedPolicy(ManagedPolicy.fromManagedPolicyArn(this, "s3ReadOnly", "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"));
	}

	private createCodebuildRole() {
		const codebuildRole = new iam.Role(this, "codebuildRole", {
			assumedBy: new iam.ServicePrincipal("codebuild.amazonaws.com")
		});

		return codebuildRole;
	}

	private addEcrPullPushPolicy(role: iam.Role, ecrRepo: Repository) {
		role.addToPolicy(
			new iam.PolicyStatement({
				effect: iam.Effect.ALLOW,
				actions: [
					"ecr:BatchGetImage",
					"ecr:InitiateLayerUpload",
					"ecr:UploadLayerPart",
					"ecr:CompleteLayerUpload",
					"ecr:BatchCheckLayerAvailability",
					"ecr:GetDownloadUrlForLayer",
					"ecr:PutImage"
				],
				resources: [ecrRepo.repositoryArn]
			})
		);
	}

	private addEcrAuthPolicy(role: iam.Role) {
		role.addToPolicy(
			new iam.PolicyStatement({
				effect: iam.Effect.ALLOW,
				actions: ["ecr:GetAuthorizationToken"],
				resources: ["*"]
			})
		);
	}

	private addLoggingPolicy(role: iam.Role) {
		role.addToPolicy(
			new iam.PolicyStatement({
				effect: iam.Effect.ALLOW,
				actions: ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
				resources: ["*"]
			})
		);
	}

	private addKmsPolicy(role: iam.Role, cmk: Key | IKey) {
		role.addToPolicy(
			new iam.PolicyStatement({
				effect: iam.Effect.ALLOW,
				actions: ["kms:Decrypt", "kms:DescribeKey", "kms:Encrypt", "kms:ReEncrypt*", "kms:GenerateDataKey*"],
				resources: [cmk.keyArn]
			})
		);
	}

	private addCodebuildPolicy(role: iam.Role) {
		role.addToPolicy(
			new iam.PolicyStatement({
				effect: iam.Effect.ALLOW,
				actions: [
					"codebuild:CreateReportGroup",
					"codebuild:CreateReport",
					"codebuild:UpdateReport",
					"codebuild:BatchPutTestCases",
					"codebuild:BatchPutCodeCoverages",
					"codecommit:*",
					"s3:Put*"
				],
				resources: ["*"]
			})
		);
	}

	private addCdkAssumePolicy(role: iam.Role) {
		role.addToPolicy(
			new iam.PolicyStatement({
				effect: iam.Effect.ALLOW,
				actions: ["sts:AssumeRole"],
				resources: ["*"]
			})
		);
	}

	private createSfnRole() {
		const sfnRole = new iam.Role(this, "sfnRole", {
			assumedBy: new CompositePrincipal(
				new ServicePrincipal("states.amazonaws.com"),
				new ServicePrincipal("lambda.amazonaws.com"),
				new ServicePrincipal("codebuild.amazonaws.com")
			)
		});

		return sfnRole;
	}

	private createLambdaRole() {
		const lambdaRole = new Role(this, "lambdaRole", {
			assumedBy: new ServicePrincipal("lambda.amazonaws.com")
		});

		return lambdaRole;
	}
}
