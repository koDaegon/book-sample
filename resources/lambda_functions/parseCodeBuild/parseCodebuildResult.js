const AWS = require("aws-sdk");
const codecommit = new AWS.CodeCommit();
const ssm = new AWS.SSM();
const codebuild = new AWS.CodeBuild();

exports.handler = async (event, context) => {
	const pullRequest = event.PullRequestDetail;
	const buildInfo = event.BuildDetail;
	// const branchName = convertBranchName(pullRequest.sourceReference);
	// const codebuildBadgeUrl = await getBadgeUrl(pullRequest.repositoryNames[0], pullRequest.pullRequestId);
	// const branchBadgeUrl = `${codebuildBadgeUrl.split("&branch=")[0]}&branch=${branchName}`;
	const beforeCommitId = await getBeforeCommit(pullRequest.sourceCommit, pullRequest.repositoryNames[0]);
	if (pullRequest.title.includes("@ContainerBuild")) {
		const ecrUrl = `https://${process.env.AWS_REGION}.console.aws.amazon.com/ecr/repositories/private/${
			context.invokedFunctionArn.split(":")[4]
		}/ecr-${pullRequest.repositoryNames[0]}-intg?region=${process.env.AWS_REGION}`;

		const output = {
			BeforeCommitId: beforeCommitId,
			AfterCommitId: pullRequest.sourceCommit,
			ResultStatus: "REVOKE",
			PullRequestId: pullRequest.pullRequestId,
			RepositoryName: pullRequest.repositoryNames[0],
			RevisionId: pullRequest.revisionId,
			BuildDetail: buildInfo,
			EventDetail: event.EventDetail,
			Content: `## Container Image Build and Push 
            \n\n **Current CodeBuild Status : ${buildInfo.CurrentStatus}**
            Container Image Pushed to [ECR](${ecrUrl})`
		};
		return output;
	} else {
		const reportArns = await getBuildReportArns(buildInfo.BuildId);
		const reportDetail = await getReportDetails(reportArns);

		const codebuildReportUrl = `https://${process.env.AWS_REGION}.console.aws.amazon.com/codesuite/codebuild/${
			context.invokedFunctionArn.split(":")[4]
		}/projects/${buildInfo.BuildId.split(":")[0]}/build/${buildInfo.BuildId.split(":")[0]}%3A${buildInfo.BuildId.split(":")[1]}/reports?region=${
			process.env.AWS_REGION
		}`;

		const output = {
			BeforeCommitId: beforeCommitId,
			AfterCommitId: pullRequest.sourceCommit,
			ResultStatus: buildInfo.CurrentStatus !== "SUCCEEDED" ? "REVOKE" : "APPROVE",
			PullRequestId: pullRequest.pullRequestId,
			RepositoryName: pullRequest.repositoryNames[0],
			RevisionId: pullRequest.revisionId,
			BuildDetail: buildInfo,
			EventDetail: event.EventDetail,
			Content: `## Unit & Coverage Test Result\n\n **Current CodeBuild Status : ${buildInfo.CurrentStatus}**
		
		
- ${parseCodebuildReport(reportDetail)[0]}
- ${parseCodebuildReport(reportDetail)[1]}

Check the details in [Codebuild Report](${codebuildReportUrl})

Thank you :)`
		};
		return output;
	}
};

// async function getBadgeUrl (repoName, prId) {
// 	try {
// 		const badgeinfo = await new Promise((resolve, reject) => {
// 			const params = {
// 				Name: `/${repoName}/PR/${prId}/BadgeUrl`
// 			};
// 			ssm.getParameter(params, (err, data) => {
// 				if (err) {
// 					console.info(err, err.stack);
// 					reject(err);
// 				} else {
// 					console.log(data);
// 					resolve(data);
// 				}
// 			});
// 		});

// 		return badgeinfo.Parameter.Value;
// 	} catch (err) {
// 		throw new Error(err);
// 	}
// }

async function getBuildReportArns (buildId) {
	try {
		const reportsArns = await new Promise((resolve, reject) => {
			const params = {
				ids: [buildId]
			};
			codebuild.batchGetBuilds(params, (err, data) => {
				if (err) {
					console.info(err, err.stack);
					reject(err);
				} else {
					console.log(data);
					resolve(data);
				}
			});
		});
		return reportsArns.builds[0]?.reportArns;
	} catch (err) {
		throw new Error(err);
	}
}

async function getReportDetails (reportArns) {
	try {
		const reportDetails = await new Promise((resolve, reject) => {
			const params = {
				reportArns
			};
			codebuild.batchGetReports(params, (err, data) => {
				if (err) {
					console.info(err, err.stack);
					reject(err);
				} else {
					console.log(data);
					resolve(data);
				}
			});
		});
		return reportDetails.reports;
	} catch (err) {
		throw new Error(err);
	}
}

async function getBeforeCommit (commitId, repo) {
	try {
		const commitDetail = await new Promise((resolve, reject) => {
			const params = {
				commitId: commitId,
				repositoryName: repo
			};
			codecommit.getCommit(params, (err, data) => {
				if (err) {
					console.info(err, err.stack);
					reject(err);
				} else {
					console.log(data);
					resolve(data);
				}
			});
		});
		return commitDetail.commit.parents[0];
	} catch (err) {
		throw new Error(err);
	}
}

function parseCodebuildReport (reportDetails) {
	const testsSummary = reportDetails.map(report => {
		if (report.type === "CODE_COVERAGE" && report.status === "COMPLETE") {
			const coverageTestSummary = `Line Coverage: ${report.codeCoverageSummary.lineCoveragePercentage}%`;
			return coverageTestSummary;
		} else {
			const unitTestResult = report.testSummary;
			const unitTestSummary = `Total Test Cases: ${unitTestResult.total}  | Succeeded Cases: ${
				unitTestResult.statusCounts.SUCCEEDED
			} | Failed Cases: ${unitTestResult.total - unitTestResult.statusCounts.SUCCEEDED}`;
			return unitTestSummary;
		}
	});
	return testsSummary;
}
