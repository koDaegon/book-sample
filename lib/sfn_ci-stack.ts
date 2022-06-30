import { Stack, StackProps, RemovalPolicy } from "aws-cdk-lib";
import { Repository, RepositoryEncryption } from "aws-cdk-lib/aws-ecr";
import { Key } from "aws-cdk-lib/aws-kms";
import { Construct } from "constructs";
import { AccountPrincipal, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Iam } from "./Construct/iam";
import { sfnCI } from "./Construct/SfnCI";
import * as codecommit from "aws-cdk-lib/aws-codecommit";
import * as path from "path";

interface SfnCiStackProps extends StackProps {
	ServiceName: string;
	AccountId: string;
	RepoName: string;
}

export class SfnCiStack extends Stack {
	constructor(scope: Construct, id: string, props: SfnCiStackProps) {
		super(scope, id, props);

		const encryptionKey = new Key(this, "encryptionKey", {
			admins: [new AccountPrincipal(props.AccountId)]
		});

		const intgEcr = new Repository(this, "intgEcr", {
			repositoryName: `ecr-${props.RepoName}-intg`,
			encryption: RepositoryEncryption.KMS,
			removalPolicy: RemovalPolicy.DESTROY
		});

		intgEcr.grantPullPush(new ServicePrincipal("codebuild.amazonaws.com"));
		intgEcr.grantPullPush(new AccountPrincipal(props.AccountId));

		const Roles = new Iam(this, "iam-roles", {
			ServiceName: props.ServiceName,
			KmsCmk: encryptionKey,
			EcrRepo: intgEcr
		});

		const codeRepo = new codecommit.Repository(this, "code-repository", {
			repositoryName: props.RepoName,
			code: codecommit.Code.fromDirectory(path.join(__dirname, "../example/application_repository/kdaegon-sample/"))
		});

		const sfn = new sfnCI(this, "sfn-ci", {
			ServiceName: props.ServiceName,
			EncryptionKey: encryptionKey,
			AllowAccountIds: [props.AccountId],
			RepoName: props.RepoName,
			ServiceRoles: {
				lambda: Roles.lambdaRole,
				sfn: Roles.sfnRole,
				codebuild: Roles.codebuildRole
			},
			AccountId: props.AccountId
		});
		codeRepo.node.addDependency(sfn);
	}
}
