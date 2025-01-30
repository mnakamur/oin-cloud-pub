/* Amplify Params - DO NOT EDIT
	API_PDFVUEAMPPRJ_BUNSYOTABLE_ARN
	API_PDFVUEAMPPRJ_BUNSYOTABLE_NAME
	API_PDFVUEAMPPRJ_CONTENTSTABLE_ARN
	API_PDFVUEAMPPRJ_CONTENTSTABLE_NAME
	API_PDFVUEAMPPRJ_GRAPHQLAPIENDPOINTOUTPUT
	API_PDFVUEAMPPRJ_GRAPHQLAPIIDOUTPUT
	API_PDFVUEAMPPRJ_GRAPHQLAPIKEYOUTPUT
	API_PDFVUEAMPPRJ_SHOMEITABLE_ARN
	API_PDFVUEAMPPRJ_SHOMEITABLE_NAME
	AUTH_PDFVUEAMPPRJ4DDE32EC_USERPOOLID
	ENV
	REGION
	STORAGE_AMPLIFYVUEPDF_BUCKETNAME
Amplify Params - DO NOT EDIT */

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
const { DynamoDBDocument } = require('@aws-sdk/lib-dynamodb');
const { DynamoDB } = require('@aws-sdk/client-dynamodb');
const { Lambda } = require('@aws-sdk/client-lambda');
const { S3Client, ListObjectVersionsCommand, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const s3client = new S3Client({ region: 'ap-northeast-1' });
const dynamoDB = DynamoDBDocument.from(new DynamoDB());
const bucketName = process.env.STORAGE_AMPLIFYVUEPDF_BUCKETNAME;
const pdfFolder = 'protected/';
const imgFolder = 'public/';
exports.handler = async (event) => {
  const bunsyoList = await listBunsyo();
  await S3ListDel(bucketName, bunsyoList, 'pdf');
  await S3ListDel(bucketName, bunsyoList, 'img');
  await ShomeiListDel(bunsyoList);
  await ContentListDel(bunsyoList);
  await BunsyoListDel(bunsyoList);
  return {
    statusCode: 200,
    body: JSON.stringify('Hello from Lambda!'),
  };
};
async function listBunsyo() {
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 37);
  const tenDaysAgoISO = tenDaysAgo.toISOString();

  const fifteenDaysAgo = new Date();
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 39);
  const fifteenDaysAgoISO = fifteenDaysAgo.toISOString();

  const bun_params = {
    TableName: process.env.API_PDFVUEAMPPRJ_BUNSYOTABLE_NAME,
    FilterExpression: 'createdAt >= :startDate AND createdAt < :endDate',
    ExpressionAttributeValues: {
      ':startDate': fifteenDaysAgoISO,
      ':endDate': tenDaysAgoISO,
    },
  };
  let result_bun = [];
  let lastEvaluatedKey = null;

  do {
    if (lastEvaluatedKey) {
      bun_params.ExclusiveStartKey = lastEvaluatedKey;
    }

    // Scanの実行
    const response = await dynamoDB.scan(bun_params);
    result_bun = result_bun.concat(response.Items);

    // 制限を超えた場合、LastEvaluatedKeyが返る
    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey); // データが残っている場合はループ継続

  return result_bun;
}

async function S3ListDel(bucketName, bunsyoList, objType) {
  for (const bunsyo of bunsyoList) {
    let prefix;

    if (objType === 'pdf') {
      prefix = `${pdfFolder}${bunsyo.identityId}/${bunsyo.createUser}/${bunsyo.pdfId}`;
    } else {
      prefix = `${imgFolder}${bunsyo.createUser}/${bunsyo.pdfId}`;
    }
    await deleteAllVersionsForPrefix(bucketName, prefix);
  }
}
async function deleteAllVersionsForPrefix(bucketName, prefix) {
  try {
    let keyMarker = null;
    let versionIdMarker = null;

    do {
      // バージョンリストを取得
      const listParams = {
        Bucket: bucketName,
        Prefix: prefix,
        KeyMarker: keyMarker,
        VersionIdMarker: versionIdMarker,
      };
      const listResponse = await s3client.send(new ListObjectVersionsCommand(listParams));
      if (listResponse.Versions && listResponse.Versions.length > 0) {
        // 削除対象リストを作成
        const deleteParams = {
          Bucket: bucketName,
          Delete: {
            Objects: listResponse.Versions.map((marker) => {
              return {
                Key: marker.Key,
                VersionId: marker.VersionId,
              };
            }),
          },
        };
        const deleteResponse = await s3client.send(new DeleteObjectsCommand(deleteParams));
      }

      keyMarker = listResponse.NextKeyMarker;
      versionIdMarker = listResponse.NextVersionIdMarker;
    } while (keyMarker && versionIdMarker); // ページが続く限りループ
  } catch (error) {
    console.error(`Error S3 deleting versions for prefix '${prefix}':`, error);
  }
}
async function ShomeiListDel(bunsyoList) {
  for (const bunsyo of bunsyoList) {
    await deleteDynamoShomei(bunsyo.pdfId);
  }
}
async function ContentListDel(bunsyoList) {
  for (const bunsyo of bunsyoList) {
    await deleteDynamoContent(bunsyo.pdfId);
  }
}
async function BunsyoListDel(bunsyoList) {
  for (const bunsyo of bunsyoList) {
    await deleteDynamoBunsyo(bunsyo.pdfId);
  }
}
async function deleteDynamoShomei(pdfId) {
  try {
    const queryParams = {
      TableName: process.env.API_PDFVUEAMPPRJ_SHOMEITABLE_NAME,
      IndexName: 'gsi-bunsyo.shomei',
      KeyConditionExpression: '#id = :id',
      ExpressionAttributeNames: {
        '#id': 'bunsyoShomeiId', // GSIで指定したキー名
      },
      ExpressionAttributeValues: {
        ':id': pdfId,
      },
    };

    // GSIを使って該当アイテムを検索
    const queryResult = await dynamoDB.query(queryParams);

    // クエリ結果に基づいてアイテムを削除
    if (queryResult.Items && queryResult.Items.length > 0) {
      for (const item of queryResult.Items) {
        const deleteParams = {
          TableName: process.env.API_PDFVUEAMPPRJ_SHOMEITABLE_NAME,
          Key: {
            id: item.id, // テーブルのパーティションキー
          },
        };

        await dynamoDB.delete(deleteParams);
        console.log(`Deleted item with shomei primaryKey: ${item.id}`);
      }
    } else {
      console.log('No items found to delete.');
    }
  } catch (queryError) {
    console.error('Error shomei querying items:', queryError);
  }
}
async function deleteDynamoContent(pdfId) {
  try {
    const queryParams = {
      TableName: process.env.API_PDFVUEAMPPRJ_CONTENTSTABLE_NAME,
      FilterExpression: 'pdfId = :pdf_id',
      ExpressionAttributeValues: {
        ':pdf_id': pdfId,
      },
    };

    // GSIを使って該当アイテムを検索
    const queryResult = await dynamoDB.scan(queryParams);

    // クエリ結果に基づいてアイテムを削除
    if (queryResult.Items && queryResult.Items.length > 0) {
      for (const item of queryResult.Items) {
        const deleteParams = {
          TableName: process.env.API_PDFVUEAMPPRJ_CONTENTSTABLE_NAME,
          Key: {
            id: item.id, // テーブルのパーティションキー
          },
        };

        await dynamoDB.delete(deleteParams);
        console.log(`Deleted content item with primaryKey: ${item.id}`);
      }
    } else {
      console.log('No items found to delete.');
    }
  } catch (queryError) {
    console.error('Error contents querying items:', queryError);
  }
}
async function deleteDynamoBunsyo(pdfId) {
  try {
    const deleteParams = {
      TableName: process.env.API_PDFVUEAMPPRJ_BUNSYOTABLE_NAME,
      Key: {
        id: pdfId, // テーブルのパーティションキー
      },
    };

    await dynamoDB.delete(deleteParams);
    console.log(`Deleted bundyo item with primaryKey: ${pdfId}`);
  } catch (queryError) {
    console.error('Error bundyo querying items:', queryError);
  }
}
async function s3ObjDel(bunsyoList) {
  let keyMarker = null;
  let versionIdMarker = null;
  const pdfParams = {
    Bucket: bucketName,
    Prefix:
      pdfFolder +
      bunsyoList[1].identityId +
      '/' +
      bunsyoList[1].createUser +
      '/' +
      bunsyoList[1].pdfId,
    KeyMarker: keyMarker,
    VersionIdMarker: versionIdMarker,
  };
  await s3client.send(new ListObjectVersionsCommand(pdfParams));

  keyMarker = null;
  versionIdMarker = null;
  const imgVParams = {
    Bucket: bucketName,
    Prefix: imgFolder + bunsyoList[1].createUser + '/' + bunsyoList[1].pdfId,
    KeyMarker: keyMarker,
    VersionIdMarker: versionIdMarker,
  };
  await s3client.send(new ListObjectVersionsCommand(imgVParams));
}

//};
