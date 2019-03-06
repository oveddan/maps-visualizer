import {MarcRecord, SubField} from './types'


// 245-a has title
// 260-c has publish year
// 260-a has publish city
// 650-a has category
// 255-a has scale
// 034-b has scale

/* YEAR PARSING */

export function getAndParseSize(record: MarcRecord) {
  const sizeString = getSubFieldFromRecord('034', 'b', record);

  return sizeString;

  // if (sizeString) {
  //   console.log(sizeString);
  // }

  // console.log(sizeString);
}

export function getAndParseYear(record: MarcRecord) {
  const tag = '260';
  const subTag = 'c';

  const yearString = getSubFieldFromRecord(tag, subTag, record);

  if (!yearString) {
    return null;
  }

  const approxYear = parseYear(yearString);  //, yearString);
  // printSubfield(dataField.subfield, 'b');

  if (!approxYear) {
    return null;
  }

  const year = approximateToMiddleYear(approxYear);

  if (!isValidYear(year)) {
    console.log('not four digits', year, yearString);
    return null;
  }
  return year;
}


const yearRegex = /^\d{4}|(d{3}?-)|(d{2}?-?-)$/

function parseYear(yearString: string) {
  // return withoutBrackets;
  const yearMatches = yearRegex.exec(yearString);

  if (yearMatches) {
    return yearMatches[0];
  } else
    return null;
  // const withoutBrackets = toStartYear(yearString);

  // const withoutC = stripC(withoutBrackets);

  // const digitsOnly = toEndOfDigits(withoutC);
}
// const withoutBrackets = yearString.replace('[', '').replace(']', '');
// return withoutBrackets;

// function toStartYear(yearString: string) {
//   if (yearString.indexOf('[') >= 0) {
//     const openBracketLocation = yearString.indexOf('[');
//     return yearString.substr(
//         openBracketLocation + 1, yearString.length - openBracketLocation);

//   } else {
//     return yearString;
//   }
// }

// function stripC(yearString: string) {
//   if (yearString.startsWith('c')) {
//     // console.log('stripping', yearString, yearString.substr(1, 4));
//     return yearString.substring(1, yearString.length - 1);
//   } else
//     return yearString;
// }


// function toEndOfDigits(yearString: string) {
//   const match = endDigitRegex.exec(yearString);

//   if (match) {
//     match[0].length;
//   } else {
//     return null;
//   }
// }

/* SIZE PARSING */

let numRecords = 0;

export function getAndParseScale(record: MarcRecord) {
  const sizeString = getSubFieldFromRecord('255', 'a', record);


  /* some types of strings we deal with:
    Scale [1:12,000]. "1ʺ = 1,000ʹ"
    Scale [ca. 1:14,500].
    Scale [1:24,000]. 1 in. equals 2,000 ft.
    Scale 1:25,000. 1 cm. = 0.25 km.
    Not drawn to scale.


    for this demo just consider the numbers to the right of the column for the
    upper scale and assume the bottom scale is 1.

  */

  // console.log('string', sizeString);

  if (sizeString && isValidSizeString(sizeString)) {
    const upperScale = getUpperScale(sizeString);

    if (upperScale) {
      const withCommasStripped = parseInt(stripCommas(upperScale));
      if (!isNaN(Number(withCommasStripped))) {
        numRecords++;
        // console.log('num records', numRecords);
        return withCommasStripped;
      } else {
        // console.log('not number', '|', sizeString, '|', upperScale);
      }
    }
    //   console.log(upperScale, '___', numRecords);
  }

  return null;
}

const commaRegex = /,/g

function stripCommas(value: string) {
  const stripped = value.replace(commaRegex, '');
  return stripped;
}

const isValidSizeString = (sizeString: string) => (
    // todo: make regex
    !sizeString.includes('Not') && !sizeString.includes('not'))

const endingBracketCharacters = ']. ';
function getUpperScale(sizeString: string) {
  const colonLocation = sizeString.indexOf(':');

  if (!colonLocation) return null;

  // find either closing bracket or space after colon to mark the end
  // of the number

  const rightSide = sizeString.substring(colonLocation + 1, sizeString.length);

  for (let i = 0; i < rightSide.length; i++) {
    const character = rightSide[i];
    if (endingBracketCharacters.includes(character)) {
      return rightSide.substring(0, i);
    }
  }
  return null;
}

/* GENERAL PARSING */

export function getSubFieldFromRecord(
    desiredTag: string, desiredSubTag: string, record: MarcRecord): string {
  for (let i = 0; i < record.datafield.length; i++) {
    const dataField = record.datafield[i];
    const tag = dataField.$.tag;
    // console.log(desiredTag, tag, i, record.datafield.length);
    if (tag !== desiredTag) continue;

    const subField = getSubfield(dataField.subfield, desiredSubTag);

    if (!subField) {
      continue;
    }

    return subField;
  }

  return null;
}

function getSubfield(subfields: [SubField], code: string): string {
  let result = null;
  for (let i = 0; i < subfields.length; i++) {
    const subfield = subfields[i];
    if (code === subfield.$.code) {
      result = subfield.$text;
      break;
    }
  }

  return result;
}

function isValidYear(yearString: string) {
  if (!yearString) return null;
  // if (yearString.length !== 4) return false;

  return yearString.match(yearRegex);
}


function approximateToMiddleYear(approxYear: string) {
  return approxYear.replace('-', '5').replace('-', '5');
}
