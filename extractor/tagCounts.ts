import * as fs from 'fs';

import {mapsDataFile, MarcRecord} from './types';

const XmlStream = require('xml-stream');

export async function parseTagCounts() {
  console.log('opening file');

  const stream = fs.createReadStream(mapsDataFile);

  console.log('creating stream');

  const xml = new XmlStream(stream);
  xml.collect('item');
  xml.collect('datafield');
  xml.collect('datafield > subfield');

  console.log('waiting for element');

  const tagCounts = new Map<string, number>();

  console.log('getting tags');

  let recordNumber = 0;

  xml.on('updateElement: record', function(record: MarcRecord) {
    try {
      record.datafield.forEach(dataField => {
        const tag = dataField.$.tag;

        if (tagCounts.has(tag)) {
          tagCounts.set(tag, tagCounts.get(tag) + 1);
        } else {
          tagCounts.set(tag, 0);
        }
      });

      recordNumber++;

      if (recordNumber % 500 === 0) {
        console.log('parsed record', recordNumber);
        saveTagCounts(tagCounts);
      }

    } catch (e) {
      console.error(e);
    }
  });

  xml.on('end', function() {
    console.log('ended');

    saveTagCounts(tagCounts);
  })
}

function toObject(tagCounts: Map<string, number>) {
  const object: {[id: string]: number} = {};

  tagCounts.forEach((count, key) => {
    object[key] = count;
  });

  return object;
}

export const tagCountPath = './tagCounts.json';

async function saveTagCounts(tagCounts: Map<string, number>) {
  const asObject = toObject(tagCounts);

  await fs.promises.writeFile(tagCountPath, JSON.stringify(asObject));
}

export async function printTagCounts() {
  const contents = await fs.promises.readFile(tagCountPath, 'utf8');

  const tagCounts: {[tag: string]: number} = JSON.parse(contents);

  const asArray: [string, number][] = [];

  Object.keys(tagCounts).forEach(tag => {
    asArray.push([tag, tagCounts[tag]]);
  });

  asArray.sort(([, countA], [, countB]) => countB - countA);

  console.log(asArray);
}
