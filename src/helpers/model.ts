export interface documentDataModel {
  class: string
  yearOfManufacture: string
  make: string
  model: string
  chassis: string
  engineNo: string
  cylinderCapacity: string
  color: string
  bodyType: string
  registrationNo: string
}

export interface extractedDataModel {
  transacation: string
  model: string
  issueDate: string
  registrationDate: string
  taxExemptWarranty: string
  manufactureYear: string
  registrationMark: string
  class: string
  taxValue: string
  chassis: string
}

export interface s3ParamsModel {
  Bucket: string
  Key: string
  Body: object
  ContentType: string
}

export interface textractParamsModel {
  Document: textract
  FeatureTypes: string[]
}

interface textract {
  S3Object: s3Bucket
}

interface s3Bucket {
  Bucket: string
  Name: string
}
