/* Amplify Params - DO NOT EDIT
	API_PDFVUEAMPPRJ_BUNSYOTABLE_ARN
	API_PDFVUEAMPPRJ_BUNSYOTABLE_NAME
	API_PDFVUEAMPPRJ_GRAPHQLAPIENDPOINTOUTPUT
	API_PDFVUEAMPPRJ_GRAPHQLAPIIDOUTPUT
	API_PDFVUEAMPPRJ_GRAPHQLAPIKEYOUTPUT
	AUTH_PDFVUEAMPPRJ4DDE32EC_USERPOOLID
	ENV
	REGION
	STORAGE_AMPLIFYVUEPDF_BUCKETNAME
Amplify Params - DO NOT EDIT */

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
var aws = require('aws-sdk');
const dynamoDB = new aws.DynamoDB.DocumentClient();
//const s3 = new aws.S3({ redion: 'ap-northeast-1' });
//const bucket = process.env.STORAGE_AMPLIFYVUEPDF_BUCKETNAME;

exports.handler = async (event) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);
  const bunsyoList = await listBunsyo();
  console.log('bunsyoList=', bunsyoList);

  if (bunsyoList.Items.length == 0) {
    return;
  }
  const s3moveResult = await pdfmove(bunsyoList);
  if (s3moveResult.status > 400) {
    return {
      statusCode: 200,
      //  Uncomment below to enable CORS requests
      //  headers: {
      //      "Access-Control-Allow-Origin": "*",
      //      "Access-Control-Allow-Headers": "*"
      //  },
      body: JSON.stringify('Hello from Lambda!'),
    };
  }

  //関数定義
  async function listBunsyo() {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 11);
    const tenDaysAgoISO = tenDaysAgo.toISOString();

    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    const fifteenDaysAgoISO = fifteenDaysAgo.toISOString();

    const bun_params = {
      TableName: 'bunsyo-lhowoo53j5agnhq2sx55vq2jba-dev',
      FilterExpression: 'createdAt >= :startDate AND createdAt < :endDate',
      ExpressionAttributeValues: {
        ':startDate': fifteenDaysAgoISO,
        ':endDate': tenDaysAgoISO,
      },
    };
    const result_bun = await dynamoDB.scan(bun_params).promise();
    return result_bun;
  }
  //
};
