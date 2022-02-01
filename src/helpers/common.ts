import * as _ from 'lodash'
import { S3, Textract } from 'aws-sdk'
import { documentDataModel, extractedDataModel, textractParamsModel } from './model'

const s3 = new S3()
const textract = new Textract()

export const formatResponse = (statusCode: number, response) => {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(response, null, '\t'),
  }
}

export const trimData = async function (data) {
  return data.replace(/(^\s+|\s+$)/g, '')
}

export const s3Upload = async function (params) {
  try {
    const result = await s3.upload(params).promise()

    return result
  } catch (error) {
    console.log('Error', error)
  }
}

export const analyzeProcess = async function (key) {
  return new Promise((resolve) => {
    const params: textractParamsModel = {
      Document: {
        S3Object: {
          Bucket: process.env.UPLOAD_BUCKET,
          Name: key,
        },
      },
      FeatureTypes: ['FORMS'],
    }

    textract.analyzeDocument(params, (error, data) => {
      if (error) {
        console.log('Error', error)

        return resolve(error)
      }
      resolve(data)
    })
  })
}

export const extractProcess = async function (formData) {
  const extractedData: extractedDataModel = {
    transacation: formData.Transaction.trimEnd(),
    model: formData.Model.trimEnd(),
    issueDate: formData['Date of Issue'].trimEnd(),
    registrationDate: formData['Date registered as Owner'].trimEnd(),
    taxExemptWarranty: formData['Value of Unexpired Portion of Tax-exempt Warranty'].trimEnd(),
    manufactureYear: formData['Year of Manufacture'].trimEnd(),
    registrationMark: formData['Registration Mark'].trimEnd(),
    class: formData.Class.trimEnd(),
    taxValue: formData['First Registration Taxable Value'].trimEnd(),
    chassis: formData[''].trimEnd(),
  }
  console.log('extractedData', extractedData)

  return extractedData
}

export const detectProcess = async (key) => {
  let detectData
  const params = {
    Document: {
      S3Object: {
        Bucket: process.env.UPLOAD_BUCKET,
        Name: key,
      },
    },
  }
  try {
    const data = await textract.detectDocumentText(params).promise()

    if (data && data.Blocks && data.Blocks.length > 1) {
      const blocks = data.Blocks.slice(1)
      const filterBlock = _.filter(blocks, (r) => r.BlockType == 'LINE')
      const mapText = _.map(filterBlock, (r) => r.Text)
      const filterString = _.filter(mapText, (r) => !isSpecialString(r))

      detectData = await extractData(filterString)
      console.log('detectData', detectData)
    }

    return detectData
  } catch (err) {
    console.log('Error', err)
  }
}

const staticLabels = [
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

function isNumber(data) {
  if (isNaN(parseInt(data))) {
    return false
  }

  return true
}

function isStaticLabel(str) {
  if (str) {
    const filterItems = _.filter(
      staticLabels,
      (r) => str.toString().toLowerCase().indexOf(r.toString().toLowerCase()) != -1
    )

    if (filterItems.length > 0) {
      return true
    }
  }

  return false
}

function removeSpecialString(str) {
  return str.replace(/[^a-zA-Z0-9]/g, '')
}

function isSpecialString(str) {
  if (str) {
    if (str.length == 2 && !isNumber(str)) {
      return true
    }
    const convertedStr = str.toString().replace(/[^a-zA-Z0-9]/g, '')

    if (convertedStr && convertedStr.length > 0) {
      return false
    }
  }

  return true
}

function getNearestLabelIndex(data, currentIndex) {
  let min = 0
  let max = 0

  for (let i = currentIndex - 1; i >= 0; i--) {
    if (isStaticLabel(data[i])) {
      min = i + 1

      break
    }
  }

  for (let i = currentIndex + 1; i < data.length; i++) {
    if (isStaticLabel(data[i])) {
      max = i - 1 < 0 ? 0 : i - 1

      break
    }
  }

  return [min, max]
}

function getYearOfManufacture(data) {
  let yearOfManufacture = ''
  const yearOfManufactureIndex = _.findIndex(
    data,
    (r) =>
      r.toString().toLowerCase().indexOf('manufacture') != -1 ||
      r.toString().toLowerCase().indexOf('year') != -1
  )

  if (yearOfManufactureIndex != -1) {
    const nearestIndexs = getNearestLabelIndex(data, yearOfManufactureIndex)

    for (let i = nearestIndexs[0]; i <= nearestIndexs[1]; i++) {
      if (data[i].length > 2 && isNumber(data[i]) && !isStaticLabel(data[i])) {
        yearOfManufacture = data[i]

        break
      }
    }
  }

  return yearOfManufacture
}

function getEngineNumber(data) {
  let engineNumber = ''

  const engineNoIndex = _.findIndex(
    data,
    (r) =>
      r.toString().toLowerCase() == 'engine no' ||
      r.toString().toLowerCase().indexOf('engine') != -1
  )

  if (engineNoIndex != -1) {
    const nearestIndexs = getNearestLabelIndex(data, engineNoIndex)

    for (let i = nearestIndexs[0]; i <= nearestIndexs[1]; i++) {
      if (data[i].length > 5 && !isStaticLabel(data[i])) {
        engineNumber = data[i]

        break
      }
    }
  }

  return engineNumber
}

function getModel(data) {
  let model = ''

  const modelIndex = _.findIndex(data, (r) => r.toString().toLowerCase() == 'model')

  if (modelIndex != -1) {
    const nearestIndexs = getNearestLabelIndex(data, modelIndex)

    for (let i = nearestIndexs[1]; i >= nearestIndexs[0]; i--) {
      if (data[i].length > 4 && !isStaticLabel(data[i])) {
        model = data[i]

        break
      }
    }
  }

  return model
}

function getChassisNumber(data) {
  let chassisNumber = ''
  const chassisIndex = _.findIndex(
    data,
    (r) =>
      r.toString().toLowerCase() == 'chassis' || r.toString().toLowerCase().indexOf('chassis') != -1
  )

  if (chassisIndex != -1) {
    const nearestIndexs = getNearestLabelIndex(data, chassisIndex)

    for (let i = nearestIndexs[0]; i <= nearestIndexs[1]; i++) {
      if (data[i].length > 10 && !isStaticLabel(data[i])) {
        chassisNumber = removeSpecialString(data[i])

        break
      }
    }
  }

  return chassisNumber
}

function getCylinderCapacity(data) {
  let cylinderCapacity = ''
  const cylinderCapacityIndex = _.findIndex(
    data,
    (r) => r.toString().toLowerCase().indexOf('cylinder') != -1
  )

  if (cylinderCapacityIndex != -1) {
    const nearestIndexs = getNearestLabelIndex(data, cylinderCapacityIndex)

    for (let i = nearestIndexs[0]; i <= nearestIndexs[1]; i++) {
      if (data[i].length == 4 && isNumber(data[i]) && !isStaticLabel(data[i])) {
        cylinderCapacity = data[i]

        break
      }
    }
  }

  return cylinderCapacity
}

function getBodyType(data) {
  let bodyType = ''
  const bodyTypeIndex = _.findIndex(
    data,
    (r) =>
      r.toString().toLowerCase() == 'body type' || r.toString().toLowerCase().indexOf(' type') != -1
  )

  if (bodyTypeIndex != -1) {
    const nearestIndexs = getNearestLabelIndex(data, bodyTypeIndex)

    for (let i = nearestIndexs[1]; i >= nearestIndexs[0]; i--) {
      if (!isStaticLabel(data[i]) && !isNumber(removeSpecialString(data[i]))) {
        bodyType = data[i]

        break
      }
    }
  }

  return bodyType
}

function getMake(data) {
  let make = ''

  const makeIndex = _.findIndex(data, (r) => r.toString().toLowerCase() == 'make')

  if (makeIndex != -1) {
    make = data[makeIndex + 1]
  } else {
    const yearOfManufactureIndex = _.findIndex(
      data,
      (r) =>
        r.toString().toLowerCase().indexOf('manufacture') != -1 ||
        r.toString().toLowerCase().indexOf('year') != -1
    )
    const countryPlaceIndex = _.findIndex(
      data,
      (r) =>
        r.toString().toLowerCase().indexOf('country') != -1 ||
        r.toString().toLowerCase().indexOf('origin') != -1
    )
    if (yearOfManufactureIndex != -1 && countryPlaceIndex != -1) {
      for (let i = yearOfManufactureIndex + 1; i < countryPlaceIndex; i++) {
        if (isNumber(data[i]) || isStaticLabel(data[i])) {
          continue
        }

        make = data[i]

        break
      }
    }
  }

  return make
}

function getClass(data) {
  let className = ''
  const classIndex = _.findIndex(data, (r) => r.toString().toLowerCase() == 'class')

  if (classIndex != -1) {
    const nearestIndexs = getNearestLabelIndex(data, classIndex)

    for (let i = nearestIndexs[1]; i >= nearestIndexs[0]; i--) {
      if (!isStaticLabel(data[i]) && !isNumber(removeSpecialString(data[i]))) {
        className = data[i]

        break
      }
    }
  } else {
    const classIndex = _.findIndex(
      data,
      (r) =>
        r.toString().toLowerCase().indexOf('car') != -1 ||
        r.toString().toLowerCase().indexOf('bus') != -1
    )

    if (classIndex != -1 && !isStaticLabel(data[classIndex])) {
      className = data[classIndex]
    }
  }

  return className
}

function getColour(data) {
  let colour = ''

  const colorIndex = _.findIndex(data, (r) => r.toString().toLowerCase() == 'colour')

  if (colorIndex != -1) {
    const nearestIndexs = getNearestLabelIndex(data, colorIndex)

    for (let i = nearestIndexs[1]; i >= nearestIndexs[0]; i--) {
      const removedStr = removeSpecialString(data[i])
      if (!isStaticLabel(data[i]) && !isNumber(removedStr) && removedStr.length > 2) {
        colour = data[i]

        break
      }
    }
  }

  return colour
}

function getRegNumber(data) {
  let regNumber = ''
  const regIndex = _.findIndex(
    data,
    (r) =>
      r.toString().toLowerCase() == 'details' || r.toString().toLowerCase().indexOf('vehicle') != -1
  )

  if (regIndex != -1) {
    const nearestIndexs = getNearestLabelIndex(data, regIndex)

    for (let i = nearestIndexs[0]; i <= nearestIndexs[1]; i++) {
      if (data[i].length > 7 && !isStaticLabel(data[i])) {
        regNumber = removeSpecialString(data[i])

        break
      }
    }
  }

  return regNumber
}

async function extractData(data) {
  const documentData: documentDataModel = {
    class: getClass(data),
    yearOfManufacture: getYearOfManufacture(data),
    make: getMake(data),
    model: getModel(data),
    chassis: getChassisNumber(data),
    engineNo: getEngineNumber(data),
    cylinderCapacity: getCylinderCapacity(data),
    color: getColour(data),
    bodyType: getBodyType(data),
    registrationNo: getRegNumber(data),
  }

  return documentData
}
