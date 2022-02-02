import * as _ from 'lodash'
import { staticLabelModel } from './model'

export function constructData(
  data,
  indexLength: number,
  numberCheck: boolean,
  value1: string,
  value2: string
) {
  console.log('DATA', data)
  let fieldName
  const fieldIndex = _.findIndex(
    data,
    (r) => r.toString().toLowerCase() == value1 || r.toString().toLowerCase().indexOf(value2) != -1
  )
  console.log('Index', fieldIndex)

  if (fieldIndex != -1) {
    const nearestIndexs = getNearestLabelIndex(data, fieldIndex)
    console.log('index min, max', nearestIndexs[0], nearestIndexs[1])

    for (let i = nearestIndexs[0]; i <= nearestIndexs[1]; i++) {
      console.log('fieldData', data[i])
      if (numberCheck) {
        if (
          data[i].length > indexLength &&
          isNumber(data[i]) &&
          !isStaticLabel(data[i]) &&
          !hasSpecialString(data[i])
        ) {
          fieldName = data[i]
          console.log('fieldName', fieldName)

          break
        }
      } else if (
        data[i].length > indexLength &&
        !isNumber(removeSpecialString(data[i])) &&
        !isStaticLabel(data[i])
      ) {
        fieldName = data[i]
        console.log('fieldName', fieldName)

        break
      }
    }
  }

  return fieldName
}

export function isSpecialString(str) {
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

function isNumber(data) {
  if (isNaN(parseInt(data))) {
    return false
  }

  return true
}

function isStaticLabel(str) {
  if (str) {
    const filterItems = _.filter(
      staticLabelModel,
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

function hasSpecialString(str) {
  const specialChars = `/^[!@#$%^&*()_+-=[]{};':"\\|,.<>/?]*$/`

  return specialChars.split('').some((char) => str.includes(char))
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

export function getMake(data) {
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

// manual constrcution

// function getClass(data) {
//   let className = ''
//   const classIndex = _.findIndex(data, (r) => r.toString().toLowerCase() == 'class')

//   if (classIndex != -1) {
//     const nearestIndexs = getNearestLabelIndex(data, classIndex)

//     for (let i = nearestIndexs[1]; i >= nearestIndexs[0]; i--) {
//       if (!isStaticLabel(data[i]) && !isNumber(removeSpecialString(data[i]))) {
//         className = data[i]

//         break
//       }
//     }
//   } else {
//     const classIndex = _.findIndex(
//       data,
//       (r) =>
//         r.toString().toLowerCase().indexOf('car') != -1 ||
//         r.toString().toLowerCase().indexOf('bus') != -1
//     )

//     if (classIndex != -1 && !isStaticLabel(data[classIndex])) {
//       className = data[classIndex]
//     }
//   }

//   return className
// }

// function getColour(data) {
//   let colour = ''

//   const colorIndex = _.findIndex(data, (r) => r.toString().toLowerCase() == 'colour')

//   if (colorIndex != -1) {
//     const nearestIndexs = getNearestLabelIndex(data, colorIndex)

//     for (let i = nearestIndexs[1]; i >= nearestIndexs[0]; i--) {
//       const removedStr = removeSpecialString(data[i])
//       if (!isStaticLabel(data[i]) && !isNumber(removedStr) && removedStr.length > 2) {
//         colour = data[i]

//         break
//       }
//     }
//   }

//   return colour
// }

// function getRegNumber(data) {
//   let regNumber = ''
//   const regIndex = _.findIndex(
//     data,
//     (r) =>
//       r.toString().toLowerCase() == 'details' || r.toString().toLowerCase().indexOf('vehicle') != -1
//   )

//   if (regIndex != -1) {
//     const nearestIndexs = getNearestLabelIndex(data, regIndex)

//     for (let i = nearestIndexs[0]; i <= nearestIndexs[1]; i++) {
//       if (data[i].length > 7 && !isStaticLabel(data[i])) {
//         regNumber = removeSpecialString(data[i])

//         break
//       }
//     }
//   }

//   return regNumber
// }

// function getSeatingCapacity(data) {
//   let seatingCapacity = ''
//   const seatingCapacityIndex = _.findIndex(
//     data,
//     (r) =>
//       r.toString().toLowerCase() == 'seating' ||
//       r.toString().toLowerCase().indexOf('capacity') != -1
//   )

//   if (seatingCapacityIndex != -1) {
//     const nearestIndexs = getNearestLabelIndex(data, seatingCapacityIndex)

//     for (let i = nearestIndexs[0]; i <= nearestIndexs[1]; i++) {
//       if (data[i].length > 0 && isNumber(data[i]) && !isStaticLabel(data[i])) {
//         seatingCapacity = removeSpecialString(data[i])

//         break
//       }
//     }
//   }

//   return seatingCapacity
// }

// function getEngineNumber(data) {
//   let engineNumber = ''

//   const engineNoIndex = _.findIndex(
//     data,
//     (r) =>
//       r.toString().toLowerCase() == 'engine no' ||
//       r.toString().toLowerCase().indexOf('engine') != -1
//   )

//   if (engineNoIndex != -1) {
//     const nearestIndexs = getNearestLabelIndex(data, engineNoIndex)

//     for (let i = nearestIndexs[0]; i <= nearestIndexs[1]; i++) {
//       if (data[i].length > 5 && !isStaticLabel(data[i])) {
//         engineNumber = data[i]

//         break
//       }
//     }
//   }

//   return engineNumber
// }

// function getModel(data) {
//   let model = ''

//   const modelIndex = _.findIndex(data, (r) => r.toString().toLowerCase() == 'model')

//   if (modelIndex != -1) {
//     const nearestIndexs = getNearestLabelIndex(data, modelIndex)

//     for (let i = nearestIndexs[1]; i >= nearestIndexs[0]; i--) {
//       if (data[i].length > 4 && !isStaticLabel(data[i])) {
//         model = data[i]

//         break
//       }
//     }
//   }

//   return model
// }

// function getChassisNumber(data) {
//   let chassisNumber = ''
//   const chassisIndex = _.findIndex(
//     data,
//     (r) =>
//       r.toString().toLowerCase() == 'chassis' || r.toString().toLowerCase().indexOf('chassis') != -1
//   )

//   if (chassisIndex != -1) {
//     const nearestIndexs = getNearestLabelIndex(data, chassisIndex)

//     for (let i = nearestIndexs[0]; i <= nearestIndexs[1]; i++) {
//       if (data[i].length > 10 && !isStaticLabel(data[i])) {
//         chassisNumber = removeSpecialString(data[i])

//         break
//       }
//     }
//   }

//   return chassisNumber
// }

// function getCylinderCapacity(data) {
//   let cylinderCapacity = ''
//   const cylinderCapacityIndex = _.findIndex(
//     data,
//     (r) => r.toString().toLowerCase().indexOf('cylinder') != -1
//   )

//   if (cylinderCapacityIndex != -1) {
//     const nearestIndexs = getNearestLabelIndex(data, cylinderCapacityIndex)

//     for (let i = nearestIndexs[0]; i <= nearestIndexs[1]; i++) {
//       if (data[i].length == 4 && isNumber(data[i]) && !isStaticLabel(data[i])) {
//         cylinderCapacity = data[i]

//         break
//       }
//     }
//   }

//   return cylinderCapacity
// }

// function getBodyType(data) {
//   let bodyType = ''
//   const bodyTypeIndex = _.findIndex(
//     data,
//     (r) =>
//       r.toString().toLowerCase() == 'body type' || r.toString().toLowerCase().indexOf(' type') != -1
//   )

//   if (bodyTypeIndex != -1) {
//     const nearestIndexs = getNearestLabelIndex(data, bodyTypeIndex)

//     for (let i = nearestIndexs[1]; i >= nearestIndexs[0]; i--) {
//       if (!isStaticLabel(data[i]) && !isNumber(removeSpecialString(data[i]))) {
//         bodyType = data[i]

//         break
//       }
//     }
//   }

//   return bodyType
// }

// function getYearOfManufacture(data) {
//   let yearOfManufacture = ''
//   const yearOfManufactureIndex = _.findIndex(
//     data,
//     (r) =>
//       r.toString().toLowerCase() == 'manufacture' ||
//       r.toString().toLowerCase().indexOf('year') != -1
//   )

//   if (yearOfManufactureIndex != -1) {
//     const nearestIndexs = getNearestLabelIndex(data, yearOfManufactureIndex)

//     for (let i = nearestIndexs[0]; i <= nearestIndexs[1]; i++) {
//       const indexLength = 2
//       const number = true
//       if (number) {
//         if (data[i].length > indexLength && isNumber(data[i]) && !isStaticLabel(data[i])) {
//           yearOfManufacture = data[i]

//           break
//         }
//       } else if (data[i].length > indexLength && !isStaticLabel(data[i])) {
//         yearOfManufacture = data[i]

//         break
//       }
//     }
//   }

//   return removeSpecialString(yearOfManufacture)
// }
