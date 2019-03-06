import * as fs from 'fs';

import {getAndParseScale, getAndParseSize, getAndParseYear, getSubFieldFromRecord} from './parsing'
import {AggregateRecord, mapsDataFile, MarcRecord, SubField} from './types';

const XmlStream = require('xml-stream');

function buildRecordParsingStream() {
  const stream = fs.createReadStream(mapsDataFile);

  console.log('creating readable stream');

  const xml = new XmlStream(stream);
  xml.collect('item');
  xml.collect('datafield');
  xml.collect('datafield > subfield');

  return xml;
}

const aggregatePath = './aggregate.json';

export async function getAndAggregateData() {
  const records: AggregateRecord[] = [];

  let recordNumber = 0;

  const xml = buildRecordParsingStream();

  let validRecords = 0;

  xml.on('updateElement: record', function(record: MarcRecord) {
    try {
      const year = getAndParseYear(record);
      const scale = getAndParseScale(record);
      const category = getSubFieldFromRecord('650', 'a', record);


      // console.log(getSubFieldFromRecord('650', 'a', record));

      if (scale && year && category) {
        validRecords++;
        records.push({
          recordNumber,
          leader: record.leader,
          scale: Number(scale),
          year,
          category
        });
      } else if (year || scale) {
        // const yearString = getSubFieldFromRecord('260', 'c', record);
        // const sizeString = getSubFieldFromRecord('034', 'b', record);
        // console.log(yearString, sizeString);
        // console.log(require('util').inspect(dataField, {depth: null}));
      }

      recordNumber++;

      // save every 500 records
      if (recordNumber % 500 === 0) {
        console.log(`parsed record ${validRecords} of ${recordNumber}`);
        saveObject(aggregatePath, records);
      }
    } catch (e) {
      console.error(e);
    }
  });

  xml.on('end', function() {
    console.log('ended...saving');

    saveObject(aggregatePath, records);
  })
}


export async function getAndSaveDataCounts(
    {getAndSaveYear, getAndSaveScale, getAndScaleSize}: {
      getAndSaveYear?: boolean,
      getAndSaveScale?: boolean,
      getAndScaleSize?: boolean
    }) {
  let recordNumber = 0;

  const yearCounts = new Map<string, number>();
  const scaleCounts = new Map<string, number>();

  const xml = buildRecordParsingStream();

  xml.on('updateElement: record', function(record: MarcRecord) {
    try {
      if (getAndScaleSize) {
        const size = getAndParseSize(record);

        // const scale = getAndParseScale(dataField);

        // if (size || scale) {
        //   console.log(record.leader);
        //   console.log(size, scale);
        // }
      }

      if (getAndSaveYear) {
        const year = getAndParseYear(record);
        if (year) {
          addCount(yearCounts, year);
        }
      }

      if (getAndSaveScale) {
        const scale = getAndParseScale(record);

        if (scale) {
          addCount(scaleCounts, String(scale));
        }
      }


      recordNumber++;

      // save every 500 records
      if (recordNumber % 500 === 0) {
        if (getAndSaveYear) {
          saveCounts(yearCountsPath, yearCounts);
        }
        if (getAndSaveScale) {
          saveCounts(scaleCountsPath, scaleCounts);
        }

        console.log('processed record ', recordNumber);
      }
    } catch (e) {
      console.error(e);
    }
  });

  xml.on('end', function() {
    console.log('ended...saving');

    if (getAndSaveYear) {
      saveCounts(yearCountsPath, yearCounts);
    }
    if (getAndSaveScale) {
      saveCounts(scaleCountsPath, scaleCounts);
    }
  })
}

function addCount(map: Map<string, number>, key: string) {
  if (map.has(key)) {
    map.set(key, map.get(key) + 1);
  } else {
    map.set(key, 1);
  }
}

const yearCountsPath = './years.json';
const scaleCountsPath = './scales.json';

async function saveObject(fileName: string, object: Object) {
  await fs.promises.writeFile(fileName, JSON.stringify(object));
}

async function saveCounts(fileName: string, counts: Map<string, number>) {
  // console.log(toObject(yearCounts));
  const asObject = toObject(counts);

  await saveObject(fileName, asObject);
}

function toObject(counts: Map<string, number>) {
  const object: {[id: string]: number} = {};

  counts.forEach((count, key) => {
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
