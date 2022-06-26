import { Stack, StackProps, RemovalPolicy } from "aws-cdk-lib";
import { Repository, RepositoryEncryption } from "aws-cdk-lib/aws-ecr";
import { Key } from "aws-cdk-lib/aws-kms";
import { Construct } from "constructs";
import { AccountPrincipal, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Iam } from "./Construct/iam";
import { sfnCI } from "./Construct/SfnCI";

interface SfnCiStackProps extends StackProps {
	ServiceName: string;
	DevOpsAccountId: string;
	RepoName: string;
}

export class SfnCiStack extends Stack {
	constructor(scope: Construct, id: string, props: SfnCiStackProps) {
		super(scope, id, props);

		const encryptionKey = new Key(this, "encryptionKey", {
			admins: [new AccountPrincipal(props.DevOpsAccountId)]
		});

		const intgEcr = new Repository(this, "intgEcr", {
			repositoryName: `ecr-${props.RepoName}-intg`,
			encryption: RepositoryEncryption.KMS,
			removalPolicy: RemovalPolicy.DESTROY
		});

		intgEcr.grantPullPush(new ServicePrincipal("codebuild.amazonaws.com"));
		intgEcr.grantPullPush(new AccountPrincipal(props.DevOpsAccountId));

		const Roles = new Iam(this, "iam-roles", {
			ServiceName: props.ServiceName,
			KmsCmk: encryptionKey,
			EcrRepo: intgEcr
		});

		new sfnCI(this, "sfn-ci", {
			ServiceName: props.ServiceName,
			EncryptionKey: encryptionKey,
			AllowAccountIds: [props.DevOpsAccountId],
			RepoName: props.RepoName, //repo name
			ServiceRoles: {
				lambda: Roles.lambdaRole,
				sfn: Roles.sfnRole,
				codebuild: Roles.codebuildRole
			},
			AccountId: props.DevOpsAccountId
		});
	}
}
