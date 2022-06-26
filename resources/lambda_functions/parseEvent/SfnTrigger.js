const AWS = require("aws-sdk");
const sfn = new AWS.StepFunctions();

exports.handler = async event => {
	// TODO implement

	let eventString = "";

	//If PR Title contains @ContainerBuild, push integration data
	if (checkContainerBuildRequired(event.detail?.title)) {
		const intgEvent = {
			...event,
			ContainerBuildRequired: "Y"
		};
		eventString = JSON.stringify(intgEvent);
	} else {
		const intgEvent = {
			...event,
			ContainerBuildRequired: "N"
		};
		eventString = JSON.stringify(intgEvent);
	}

	console.log(eventString);

	await startSfn(process.env.SFN_ARN, eventString);
	const response = {
		statusCode: 200,
		body: JSON.stringify(event)
	};
	return response;
};

async function startSfn (arn, event) {
	try {
		const sfnDetails = await new Promise((resolve, reject) => {
			const params = {
				stateMachineArn: arn,
				input: event,
				name: `feature-ci-${Math.random()
					.toString(36)
					.slice(2, 11)}`
			};
			sfn.startExecution(params, (err, data) => {
				if (err) {
					console.info(err, err.stack);
					reject(err);
				} else {
					console.log(data);
					resolve(data);
				}
			});
		});
		return sfnDetails;
	} catch (err) {
		throw new Error(err);
	}
}

function checkContainerBuildRequired (prTitle) {
	return prTitle.includes("@ContainerBuild") ? true : false;
}
