/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getBunsyo = /* GraphQL */ `
  query GetBunsyo($id: ID!) {
    getBunsyo(id: $id) {
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
export const listBunsyos = /* GraphQL */ `
  query ListBunsyos(
    $filter: ModelBunsyoFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listBunsyos(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
        id
        updatedAt
        owner
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const bunsyoByCreateUser = /* GraphQL */ `
  query BunsyoByCreateUser(
    $createUser: ID!
    $createdAt: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelbunsyoFilterInput
    $limit: Int
    $nextToken: String
  ) {
    bunsyoByCreateUser(
      createUser: $createUser
      createdAt: $createdAt
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
        id
        updatedAt
        owner
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getShomei = /* GraphQL */ `
  query GetShomei($id: ID!) {
    getShomei(id: $id) {
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
export const listShomeis = /* GraphQL */ `
  query ListShomeis(
    $filter: ModelShomeiFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listShomeis(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
        createdAt
        updatedAt
        owner
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const shomeiByBunsyo = /* GraphQL */ `
  query ShomeiByBunsyo(
    $bunsyoShomeiId: ID!
    $seq: ModelIntKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelShomeiFilterInput
    $limit: Int
    $nextToken: String
  ) {
    shomeiByBunsyo(
      bunsyoShomeiId: $bunsyoShomeiId
      seq: $seq
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
        createdAt
        updatedAt
        owner
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getContents = /* GraphQL */ `
  query GetContents($id: ID!) {
    getContents(id: $id) {
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
export const listContents = /* GraphQL */ `
  query ListContents(
    $filter: ModelContentsFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listContents(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const contentsByShomei = /* GraphQL */ `
  query ContentsByShomei(
    $shomeiContentId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelContentsFilterInput
    $limit: Int
    $nextToken: String
  ) {
    contentsByShomei(
      shomeiContentId: $shomeiContentId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
