/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateBunsyo = /* GraphQL */ `
  subscription OnCreateBunsyo(
    $filter: ModelSubscriptionBunsyoFilterInput
    $owner: String
  ) {
    onCreateBunsyo(filter: $filter, owner: $owner) {
      pdfId
      createUser
      userName
      userEmail
      docName
      bunStatus
      pageNum
      shomeiLength
      docRef
      docRefExp
      identityId
      createdAt
      shomei {
        nextToken
        __typename
      }
      id
      updatedAt
      owner
      __typename
    }
  }
`;
export const onUpdateBunsyo = /* GraphQL */ `
  subscription OnUpdateBunsyo(
    $filter: ModelSubscriptionBunsyoFilterInput
    $owner: String
  ) {
    onUpdateBunsyo(filter: $filter, owner: $owner) {
      pdfId
      createUser
      userName
      userEmail
      docName
      bunStatus
      pageNum
      shomeiLength
      docRef
      docRefExp
      identityId
      createdAt
      shomei {
        nextToken
        __typename
      }
      id
      updatedAt
      owner
      __typename
    }
  }
`;
export const onDeleteBunsyo = /* GraphQL */ `
  subscription OnDeleteBunsyo(
    $filter: ModelSubscriptionBunsyoFilterInput
    $owner: String
  ) {
    onDeleteBunsyo(filter: $filter, owner: $owner) {
      pdfId
      createUser
      userName
      userEmail
      docName
      bunStatus
      pageNum
      shomeiLength
      docRef
      docRefExp
      identityId
      createdAt
      shomei {
        nextToken
        __typename
      }
      id
      updatedAt
      owner
      __typename
    }
  }
`;
export const onCreateShomei = /* GraphQL */ `
  subscription OnCreateShomei(
    $filter: ModelSubscriptionShomeiFilterInput
    $owner: String
  ) {
    onCreateShomei(filter: $filter, owner: $owner) {
      id
      seq
      bunsyoShomeiId
      name
      mail
      shomeiNaiyo
      shomeiStatus
      certificate
      timeStampCert
      shomeiTime
      commentToAuthor
      commentToSigner
      messageId
      content {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const onUpdateShomei = /* GraphQL */ `
  subscription OnUpdateShomei(
    $filter: ModelSubscriptionShomeiFilterInput
    $owner: String
  ) {
    onUpdateShomei(filter: $filter, owner: $owner) {
      id
      seq
      bunsyoShomeiId
      name
      mail
      shomeiNaiyo
      shomeiStatus
      certificate
      timeStampCert
      shomeiTime
      commentToAuthor
      commentToSigner
      messageId
      content {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const onDeleteShomei = /* GraphQL */ `
  subscription OnDeleteShomei(
    $filter: ModelSubscriptionShomeiFilterInput
    $owner: String
  ) {
    onDeleteShomei(filter: $filter, owner: $owner) {
      id
      seq
      bunsyoShomeiId
      name
      mail
      shomeiNaiyo
      shomeiStatus
      certificate
      timeStampCert
      shomeiTime
      commentToAuthor
      commentToSigner
      messageId
      content {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const onCreateContents = /* GraphQL */ `
  subscription OnCreateContents(
    $filter: ModelSubscriptionContentsFilterInput
    $owner: String
  ) {
    onCreateContents(filter: $filter, owner: $owner) {
      pdfId
      id
      seq
      type
      page
      width
      height
      x
      Y
      scale
      pageHeight
      size
      file
      fileType
      S3imgKey
      fontFamily
      lineHeight
      lineCount
      lines
      text
      objComment
      date
      path
      shomeiContentId
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const onUpdateContents = /* GraphQL */ `
  subscription OnUpdateContents(
    $filter: ModelSubscriptionContentsFilterInput
    $owner: String
  ) {
    onUpdateContents(filter: $filter, owner: $owner) {
      pdfId
      id
      seq
      type
      page
      width
      height
      x
      Y
      scale
      pageHeight
      size
      file
      fileType
      S3imgKey
      fontFamily
      lineHeight
      lineCount
      lines
      text
      objComment
      date
      path
      shomeiContentId
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const onDeleteContents = /* GraphQL */ `
  subscription OnDeleteContents(
    $filter: ModelSubscriptionContentsFilterInput
    $owner: String
  ) {
    onDeleteContents(filter: $filter, owner: $owner) {
      pdfId
      id
      seq
      type
      page
      width
      height
      x
      Y
      scale
      pageHeight
      size
      file
      fileType
      S3imgKey
      fontFamily
      lineHeight
      lineCount
      lines
      text
      objComment
      date
      path
      shomeiContentId
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
