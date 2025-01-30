/* Amplify Params - DO NOT EDIT
	AUTH_PDFVUEAMPPRJ4DDE32EC_USERPOOLID
	ENV
	REGION
Amplify Params - DO NOT EDIT */

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
  //console.error(`EVENT: ${JSON.stringify(event)}`);
  console.error(`EVENT: ${event.body}`);
  return {
    statusCode: 200,

    body: JSON.stringify('Hello from Lambda!'),
  };
};
