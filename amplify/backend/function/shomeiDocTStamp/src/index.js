/* Amplify Params - DO NOT EDIT
	API_PDFVUEAMPPRJ_BUNSYOTABLE_ARN
	API_PDFVUEAMPPRJ_BUNSYOTABLE_NAME
	API_PDFVUEAMPPRJ_GRAPHQLAPIENDPOINTOUTPUT
	API_PDFVUEAMPPRJ_GRAPHQLAPIIDOUTPUT
	API_PDFVUEAMPPRJ_GRAPHQLAPIKEYOUTPUT
	API_PDFVUEAMPPRJ_SHOMEITABLE_ARN
	API_PDFVUEAMPPRJ_SHOMEITABLE_NAME
	AUTH_PDFVUEAMPPRJ4DDE32EC_USERPOOLID
	ENV
	FUNCTION_SHOMEICOMPLETE_NAME
	REGION
	STORAGE_AMPLIFYVUEPDF_BUCKETNAME
Amplify Params - DO NOT EDIT */

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */

const { DynamoDBDocument } = require('@aws-sdk/lib-dynamodb');
const { DynamoDB } = require('@aws-sdk/client-dynamodb');
const { Lambda } = require('@aws-sdk/client-lambda');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const client = new S3Client({ region: 'ap-northeast-1' });

const lambda = new Lambda();
const dynamoDB = DynamoDBDocument.from(new DynamoDB());

const https = require('https');
const SignPdfError = require('node-signpdf/src/SignPdfError');
const plainAddPlaceholder = require('node-signpdf/src/helpers/plainAddPlaceholder');
const SignPdfforKms = require('node-signpdf/src/signpdfforKms');

const bucket = process.env.STORAGE_AMPLIFYVUEPDF_BUCKETNAME;
const url = process.env.TSA_URL;
const tsaOptions = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/timestamp-query',
  },
};

exports.handler = async (event) => {
  const { pdfId, createUserId } = event;
  const TstHeader = JSON.parse(process.env.TSTHEADRE);

  try {
    const bunResult = await queryDynamoDB(pdfId);
    const s3folder = extractS3Folder(bunResult.Items[0].docRef);
    const fileName = `${s3folder}${createUserId}/${pdfId}`;

    const pdfBuffer = await getS3Object(bucket, fileName);
    const dummyPRkey = await getS3Object(bucket, process.env.DUM_PRKEY);
    const pemWK = await getS3Object(bucket, process.env.TSA_PEM);

    let pdfWithPlaceholder = await plainAddPlaceholder({
      pdfBuffer,
      reason: 'DocTimeStamp',
      signatureLength: 8192,
      location: 'tokyo',
    });

    // KMS署名実行
    const { pdf, byteRange, placeholderLength, md_timeStamp } = new SignPdfforKms().sign(
      pdfWithPlaceholder,
      dummyPRkey,
      pemWK
    );

    const timestamp = await getTimestamp(tsaOptions, url, md_timeStamp, TstHeader);
    const signedPdf = insertSignature(pdf, timestamp, byteRange, placeholderLength);

    await uploadToS3(bucket, fileName, signedPdf);

    await updateDynamoDB(pdfId, 'complete');

    await invokeLambda({ pdfId, createUserId, s3folder });
    return 'success';
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, body: error.message };
  }
};
async function queryDynamoDB(pdfId) {
  const params = {
    TableName: process.env.API_PDFVUEAMPPRJ_BUNSYOTABLE_NAME,
    KeyConditionExpression: 'id = :id',
    ExpressionAttributeValues: { ':id': pdfId },
  };
  return await dynamoDB.query(params);
}

function extractS3Folder(docRef) {
  const decodedUrl = decodeURIComponent(docRef);
  return decodedUrl.match(/protected\/([^\/]+)\//)[0];
}

async function getS3Object(bucket, key) {
  const params = { Bucket: bucket, Key: key };
  try {
    const command = new GetObjectCommand(params);
    const response = await client.send(command);
    const resByteArray = await response.Body.transformToByteArray();
    const bodyBuffer = Buffer.from(resByteArray);

    return bodyBuffer;
  } catch (error) {
    throw new Error(`Error getting object from S3: ${key} - ${error.message}`);
  }
}
async function uploadToS3(bucket, key, body) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
  });

  try {
    const response = await client.send(command);
  } catch (error) {
    throw new Error(`Error uploading to S3: ${key} - ${error.message}`);
  }
}

async function updateDynamoDB(pdfId, status) {
  const params = {
    TableName: process.env.API_PDFVUEAMPPRJ_BUNSYOTABLE_NAME,
    Key: { id: pdfId },
    UpdateExpression: 'set #a = :x,#b =:y',
    ExpressionAttributeNames: { '#a': 'bunStatus', '#b': 'updatedAt' },
    ExpressionAttributeValues: { ':x': status, ':y': new Date().toISOString() },
  };
  await dynamoDB.update(params);
}

async function invokeLambda(payload) {
  const params = {
    FunctionName: process.env.FUNCTION_SHOMEICOMPLETE_NAME,
    InvocationType: 'Event',
    Payload: JSON.stringify(payload),
  };
  await lambda.invoke(params);
  console.log('Lambda invoked successfully');
}

async function getTimestamp(options, url, md_timestamp, TstHeader) {
  const buf = buildTimestampRequest(md_timestamp, TstHeader);
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks).slice(9).toString('binary')));
    });
    req.on('error', reject);
    req.write(buf);
    req.end();
  });
}

function buildTimestampRequest(md_timestamp, TstHeader) {
  const components = [
    Buffer.from(TstHeader.sha512Withnounce_h, 'hex'), // sha512Withnounce_h
    Buffer.from(TstHeader.req_version, 'hex'), // req_version
    Buffer.from(TstHeader.req_sha512, 'hex'), // req_sha512
    Buffer.from(TstHeader.req_mdh, 'hex'), // req_mdh
    Buffer.from(md_timestamp, 'binary'), // md_b
    Buffer.from(TstHeader.req_nounceh, 'hex'), // req_nounceh
    Buffer.from(TstHeader.req_nouce, 'hex'), // req_nouce
    Buffer.from(TstHeader.req_b, 'hex'), // req_b
  ];
  return Buffer.concat(components);
}
function insertSignature(pdf, raw, byteRange, placeholderLength) {
  if (raw.length * 2 > placeholderLength) {
    throw new SignPdfError(
      `Signature exceeds placeholder length: ${raw.length * 2} > ${placeholderLength}`,
      SignPdfError.TYPE_INPUT
    );
  }
  let signature = Buffer.from(raw, 'binary').toString('hex');
  signature += Buffer.from(
    String.fromCharCode(0).repeat(placeholderLength / 2 - raw.length)
  ).toString('hex');
  return Buffer.concat([
    pdf.slice(0, byteRange[1]),
    Buffer.from(`<${signature}>`),
    pdf.slice(byteRange[1]),
  ]);
}
