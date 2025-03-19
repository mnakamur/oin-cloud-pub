/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createBunsyo = /* GraphQL */ `
  mutation CreateBunsyo(
    $input: CreateBunsyoInput!
    $condition: ModelBunsyoConditionInput
  ) {
    createBunsyo(input: $input, condition: $condition) {
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
export const updateBunsyo = /* GraphQL */ `
  mutation UpdateBunsyo(
    $input: UpdateBunsyoInput!
    $condition: ModelBunsyoConditionInput
  ) {
    updateBunsyo(input: $input, condition: $condition) {
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
export const deleteBunsyo = /* GraphQL */ `
  mutation DeleteBunsyo(
    $input: DeleteBunsyoInput!
    $condition: ModelBunsyoConditionInput
  ) {
    deleteBunsyo(input: $input, condition: $condition) {
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
export const createShomei = /* GraphQL */ `
  mutation CreateShomei(
    $input: CreateShomeiInput!
    $condition: ModelShomeiConditionInput
  ) {
    createShomei(input: $input, condition: $condition) {
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
export const updateShomei = /* GraphQL */ `
  mutation UpdateShomei(
    $input: UpdateShomeiInput!
    $condition: ModelShomeiConditionInput
  ) {
    updateShomei(input: $input, condition: $condition) {
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
export const deleteShomei = /* GraphQL */ `
  mutation DeleteShomei(
    $input: DeleteShomeiInput!
    $condition: ModelShomeiConditionInput
  ) {
    deleteShomei(input: $input, condition: $condition) {
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
export const createContents = /* GraphQL */ `
  mutation CreateContents(
    $input: CreateContentsInput!
    $condition: ModelContentsConditionInput
  ) {
    createContents(input: $input, condition: $condition) {
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
export const updateContents = /* GraphQL */ `
  mutation UpdateContents(
    $input: UpdateContentsInput!
    $condition: ModelContentsConditionInput
  ) {
    updateContents(input: $input, condition: $condition) {
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
export const deleteContents = /* GraphQL */ `
  mutation DeleteContents(
    $input: DeleteContentsInput!
    $condition: ModelContentsConditionInput
  ) {
    deleteContents(input: $input, condition: $condition) {
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
