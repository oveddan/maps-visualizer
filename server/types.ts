export const mapsDataFile = './data/Maps.2014.part01.xml'

export type SubField = {
  '$name': string,
  '$text': string,
  '$': {'code': string}
};

export type DataField = {
  '$': {'tag': string}
  subfield: [SubField]
};

export type MarcRecord = {
  leader: string,
  controlfield: Object,
  datafield: [DataField]
};


export const tags = {
  '500': 'General note',
  '651': 'Geographic name',
  '052': 'Geographic Classification',
  '245': 'Title and statement of responsibility',
  '010': 'Library of Congress Control Number',
  // not useful:
  '040': 'Cataloging source',
  // shows physical dimensions:
  '300': 'Physical description',
  '050': 'Call number',
  // contains published statement city and year
  '260': 'Publication statement',
  // contains map type and location
  '650': 'Subject Added Entry-Topical Term',
  // contains map description
  '110': 'Main entry (corporate name)',
  // contains either scale or scale not given, or sometimes coords
  '255': 'Cartographic Mathematical Data',
  // contains box and horizontal scale
  '034': 'Coded Cartographic Mathematical Data',
  '246': 'Varying form of title',
  // corporate name of publishing authority
  '710': 'Added entry (corporate name)'
};
