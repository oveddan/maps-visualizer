import { Component } from 'react'
import * as React from 'react'
import { get } from 'axios';

// const aggregate = require('../data/aggregate.json');
type ResultEntry = {
  category: string,
  year: number,
  count: number
};


type state = {
  data: ResultEntry[],
  categories: string[]
}

import { AggregateRecord } from '../extractor/types'
import d3 = require('d3');

const radius = 20;
const width = 700;
const height = 700;


const margin = ({top: 20, right: 20, bottom: 20, left: 20})

const minYear = 1850;

export default class Visualization extends Component {
  state: state = {
    data: [],
    categories: []
  };

  async componentDidMount() {
    const response : { data: AggregateRecord[] } = await get('/aggregate.json');

    const filterData = response.data.filter(({year}) => Number(year) >= minYear && Number(year) <= maxYear)

    const categories = getTopXCategories(filterData , 10);
    const data = toCategoryCountsByYear(filterData , categories);

    this.setState({
      categories,
      data
    })
  }

  render() {
    const { data, categories } = this.state;

    if (!data || !categories) return null;

    const x = d3.scaleLinear()
      .domain(d3.extent(data, d => d.year))
      .range([margin.left, width - margin.right])

    console.log('max', d3.max(data, d => d.count));

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count)])
      .range([height - margin.bottom, margin.top])

    const area = d3.area<ResultEntry>()
      .curve(d3.curveStep)
      .x(d => x(d.year))
      .y0(() => y(0))
      .y1(d => y(d.count))

    const color = d3.scaleOrdinal(d3.schemeCategory10).domain(categories);
      console.log('the categories', categories, color.domain().length, color.domain().slice().reverse());

    const dataGroupedByCategory = groupByCategory(data);

    const colorsToRender = color.domain().slice().reverse();

    const xAxis = d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0).tickFormat(x => String(x));

    const yAxis = d3.axisRight(y);

    return (
        <svg
          width={width}
          height={height}
        >
         <g>
            {Object.keys(dataGroupedByCategory).map((category, i)=> (
              <path key={i} d={area(dataGroupedByCategory[category])} fill={color(category)}/>
            ))}
          </g>
          <g transform={`translate(${margin.left + 1},${margin.top})`} fontFamily='san-serif' fontSize={10}>
              {colorsToRender.map((c, i) => (
                <g key={i} transform={`translate(0,${i * 20})`} >
                  <rect width={19} height={19} fill={color(c)} />
                  <text x={24} y={9.5} dy='0.35em'>{c}</text>
                </g>
              ))}
          </g>
          <g transform={`translate(0,${height - margin.bottom})`}
             ref={node => d3.select(node).call(xAxis)}
          />
          <g transform={`translate(${width - margin.right},0)`}
             ref={node => d3.select(node).call(yAxis).call(g => g.select('.domain').remove())}
          />
         </svg>
      );
  }
}


// used to filter out outliers
const maxYear = 2019;

function getTopXCategories(records: AggregateRecord[], amountToSelect: number): string[] {
  const categoryCounts = new Map<string, number>();

  for(let record of records) {
    const category = record.category.toLowerCase().replace('.','');

    // console.log(record);
    if (categoryCounts.has(category)) {
      categoryCounts.set(category, categoryCounts.get(category) + 1);
    } else
    categoryCounts.set(category, 1);
  }

  const asArray: [string, number][] = [];

  for(let category of categoryCounts.keys()){
    asArray.push([category, categoryCounts.get(category)]);
  }

  asArray.sort(([, countA], [, countB]) => countB - countA);

  console.log('top categories', asArray);

  return asArray.slice(0, amountToSelect).map(([category]) => category);
}


function toCategoryCountsByYear(data: AggregateRecord[], categories: string[]) {
  // Compute the top nine industries, plus an “Other” category.

  const resultMap = new Map<number, Map<string, number>>();

  for(let year = minYear; year < maxYear; year++) {
    const categoryMap = new Map<string, number>();

    for(let category of categories) {
      categoryMap.set(category, 0);
    }

    categoryMap.set('other', 0);

    resultMap.set(year, categoryMap);
  }

  for(let record of data) {
    const category = record.category.toLowerCase();
    if (!categories.includes(category))
      continue;
    // const categoryToUse = categories.includes(category) ? category : 'other';

    if (resultMap.has(Number(record.year))) {
      const categoryMap = resultMap.get(Number(record.year))

      categoryMap.set(category, categoryMap.get(category) + 1);
    }

  }

  return flatten(resultMap);
}

function groupByCategory(entries: ResultEntry[]) {
  const result: {[category: string] : ResultEntry[]} = {};

  for(let entry of entries) {
    const entriesOfCategory = result[entry.category] || []
    entriesOfCategory.push(entry)
    result[entry.category] = entriesOfCategory;
  }
  return result;
}

function flatten(resultMap: Map<number, Map<string, number>>){
  const result: ResultEntry[] = []

  for(let year of resultMap.keys()) {
    for(let category of resultMap.get(year).keys()) {
      result.push({
        category,
        year,
        count: resultMap.get(year).get(category)
      })
    }
  }

  return result;
}

// const getMean = (numbers: number[]) => sum(numbers) / numbers.length;

const sum = (numbers: number[]) => numbers.reduce((result, current) => current + result, 0);
