import * as fs from 'fs';
import {open} from 'inspector';

import {mapsDataFile, MarcRecord, SubField} from './types';

const XmlStream = require('xml-stream');

export async function parseRecords() {
  console.log('opening file');

  const stream = fs.createReadStream(mapsDataFile);

  console.log('creating stream');

  const xml = new XmlStream(stream);
  xml.collect('item');
  xml.collect('datafield');
  xml.collect('datafield > subfield');

  console.log('waiting for element');

  console.log('getting tags');

  let recordNumber = 0;

  // 245-a has title
  // 260-c has publish year
  // 260-a has publish city
  // 650-a has category
  // 255-a has scale
  // 034-b has scale

  const yearCounts = new Map<string, number>();

  xml.on('updateElement: record', function(record: MarcRecord) {
    try {
      record.datafield.forEach(dataField => {
        const tag = dataField.$.tag;

        if (tag === '260') {
          const yearString = getSubfield(dataField.subfield, 'c');
          if (yearString) {
            const approxYear = parseYear(yearString);  //, yearString);
            // printSubfield(dataField.subfield, 'b');

            const year = approximateToMiddleYear(approxYear);

            if (!isFourDigits(year)) {
              console.log('not four digits', year, yearString);
            } else {
              if (yearCounts.has(year)) {
                yearCounts.set(year, yearCounts.get(year) + 1);
              } else {
                yearCounts.set(year, 1);
              }
            }
          }
        }

        //   if (tagCounts.has(tag)) {
        //     tagCounts.set(tag, tagCounts.get(tag) + 1);
        //   } else {
        //     tagCounts.set(tag, 0);
        //   }
      });

      recordNumber++;

      if (recordNumber % 500 === 0) {
        console.log('parsed record', recordNumber);
        saveData(yearCounts);
        // saveTagCounts(tagCounts);
      }

    } catch (e) {
      console.error(e);
    }
  });

  xml.on('end', function() {
    console.log('ended');

    // saveTagCounts(tagCounts);
  })
}

function stripC(yearString: string) {
  if (yearString.startsWith('c')) {
    // console.log('stripping', yearString, yearString.substr(1, 4));
    return yearString.substr(1, 4);
  } else
    return yearString.substr(0, 4);
}

function parseYear(yearString: string) {
  if (yearString.indexOf('[') >= 0) {
    const openBracketLocation = yearString.indexOf('[');
    const withoutBrackets = yearString.substr(
        openBracketLocation + 1, yearString.length - openBracketLocation);

    // return withoutBrackets;

    return stripC(withoutBrackets);
  } else {
    return stripC(yearString);
  }
  // const withoutBrackets = yearString.replace('[', '').replace(']', '');
  // return withoutBrackets;
}

const yearCountsPath = './years.json';

async function saveData(yearCounts: Map<string, number>) {
  // console.log(toObject(yearCounts));
  const asObject = toObject(yearCounts);

  await fs.promises.writeFile(yearCountsPath, JSON.stringify(asObject));
}

function toObject(tagCounts: Map<string, number>) {
  const object: {[id: string]: number} = {};

  tagCounts.forEach((count, key) => {
    object[key] = count;
  });

  return object;
}

function printSubfield(subfields: [SubField], code: string) {
  // console.log(fieldName + ':');

  subfields.forEach(subfield => {
    if (code === subfield.$.code) console.log(subfield.$.code, subfield.$text);
  })
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

export async function printYearCounts() {
  const contents = await fs.promises.readFile(yearCountsPath, 'utf8');

  const tagCounts: {[tag: string]: number} = JSON.parse(contents);

  const asArray: [string, number][] = [];

  Object.keys(tagCounts).forEach(tag => {
    asArray.push([tag, tagCounts[tag]]);
  });

  asArray.sort(([, countA], [, countB]) => countB - countA);

  console.log(asArray);
}

const numberRegex = /^\d{4}$/

function isFourDigits(yearString: string) {
  if (yearString.length !== 4) return false;

  return yearString.match(numberRegex);
}


function approximateToMiddleYear(approxYear: string) {
  return approxYear.replace('-', '5').replace('-', '5');
}
