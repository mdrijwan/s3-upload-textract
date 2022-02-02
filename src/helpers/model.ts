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
  seatingCapacity: string
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
  Document: textractDocModel
  FeatureTypes: string[]
}

interface textractDocModel {
  S3Object: s3BucketModel
}

interface s3BucketModel {
  Bucket: string
  Name: string
}

export const staticLabelModel = [
  'Document',
  'Mark',
  'Manufacture',
  'Country',
  'Model',
  'Seating',
  'Chassis',
  'Passenger',
  'Standing',
  'Engine',
  'First',
  'Cylinder',
  'Capacity',
  'Rated',
  'Power',
  'Taxable',
  'Value',
  'Registration',
  'Type',
  'Tax-exempt',
  'Accessories',
  'Tax',
  'Approval',
  'No',
  'Unexpired',
  'Portion',
  'Warranty',
  'Vehicle',
  'Length',
  'Number',
  'Previous',
  'Owner',
  'Width',
  'Date',
  'Height',
  'Gross',
  'Conditions',
  'Licence',
  'Axle',
  'Combined',
  'Weight',
  'REMARKS',
  'Luggage',
  'REGISTERED',
  'Signature',
  'Name',
  'Colour',
  'Of',
  'Hong Kong',
  'Special',
  'Administrative',
  'Region',
  'Class',
]
