import * as records from './records';
import * as tagCounts from './tagCounts';

tagCounts.printTagCounts();


records.getAndAggregateData();
// records.getAndSaveDataCounts({getAndSaveScale: true});
