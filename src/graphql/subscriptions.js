/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateBunsyo = /* GraphQL */ `
  subscription OnCreateBunsyo($filter: ModelSubscriptionBunsyoFilterInput) {
    onCreateBunsyo(filter: $filter) {
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
      __typename
    }
  }
`;
export const onUpdateBunsyo = /* GraphQL */ `
  subscription OnUpdateBunsyo($filter: ModelSubscriptionBunsyoFilterInput) {
    onUpdateBunsyo(filter: $filter) {
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
      __typename
    }
  }
`;
export const onDeleteBunsyo = /* GraphQL */ `
  subscription OnDeleteBunsyo($filter: ModelSubscriptionBunsyoFilterInput) {
    onDeleteBunsyo(filter: $filter) {
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
      __typename
    }
  }
`;
export const onCreateShomei = /* GraphQL */ `
  subscription OnCreateShomei($filter: ModelSubscriptionShomeiFilterInput) {
    onCreateShomei(filter: $filter) {
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
      __typename
    }
  }
`;
export const onUpdateShomei = /* GraphQL */ `
  subscription OnUpdateShomei($filter: ModelSubscriptionShomeiFilterInput) {
    onUpdateShomei(filter: $filter) {
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
      __typename
    }
  }
`;
export const onDeleteShomei = /* GraphQL */ `
  subscription OnDeleteShomei($filter: ModelSubscriptionShomeiFilterInput) {
    onDeleteShomei(filter: $filter) {
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
      __typename
    }
  }
`;
export const onCreateContents = /* GraphQL */ `
  subscription OnCreateContents($filter: ModelSubscriptionContentsFilterInput) {
    onCreateContents(filter: $filter) {
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
      __typename
    }
  }
`;
export const onUpdateContents = /* GraphQL */ `
  subscription OnUpdateContents($filter: ModelSubscriptionContentsFilterInput) {
    onUpdateContents(filter: $filter) {
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
      __typename
    }
  }
`;
export const onDeleteContents = /* GraphQL */ `
  subscription OnDeleteContents($filter: ModelSubscriptionContentsFilterInput) {
    onDeleteContents(filter: $filter) {
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
      __typename
    }
  }
`;
