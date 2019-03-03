// import {parseString} from 'xml2js';

import * as fs from 'fs';

const XmlStream = require('xml-stream');

const mapsDataFile = './data/Maps.2014.part01.xml'

type SubField = {
  '$name': string,
  '$text': string,
  '$': {'code': string}
}

type DataField = {
  '$': {'tag': string}
  subfield: [SubField]
}

type MarcRecord =
    {
      leader: string,
      controlfield: Object,
      datafield: [DataField]
    }

async function
init() {
  console.log('opening file');

  const stream = fs.createReadStream(mapsDataFile);

  console.log('creating stream');

  const xml = new XmlStream(stream);
  xml.collect('item');
  xml.collect('datafield');
  xml.collect('datafield > subfield');

  console.log('waiting for element');

  xml.on('updateElement: record', function(record: MarcRecord) {
    // Change <title> child to a new value, composed of its previous value
    // and the value of <pubDate> child.
    // console.log(JSON.stringify(record));
    try {
      console.log('\n\nRECORD', record.leader);

      record.datafield.forEach(dataField => {
        console.log('datafield:', dataField.$.tag);
        console.log('subfields:');
        dataField.subfield.forEach(subfield => {
          console.log(subfield.$.code, subfield.$text);
        });
      });
    } catch (e) {
      console.error(e);
    }
  });

  // When each chunk of unselected on unbuffered data is returned,
  // pass it to stdout
  xml.on('data', function(data: any) {
    // process.stdout.write(data);
  });
}

init();

// function parseXmlString(xml: string) {
//   return new Promise((resolve, reject) => {
//     parseString(xml, (err, result) => {
//       if (err)
//         reject(err);

//       else {
//         resolve(result);
//       }
//     });
//   });
// }
