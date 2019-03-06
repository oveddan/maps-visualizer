import { Component } from 'react'
import * as React from 'react'
import { get } from 'axios'

import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts'
import { string } from 'prop-types';
import { getMaxListeners } from 'cluster';

const data = [
  { x: 100, y: 200, z: 200 },
  { x: 120, y: 100, z: 260 },
  { x: 170, y: 300, z: 400 },
  { x: 140, y: 250, z: 280 },
  { x: 150, y: 400, z: 500 },
  { x: 110, y: 280, z: 200 },
];

// const aggregate = require('../data/aggregate.json');

type state = {
  data: Object[]
}

export default class Visualization extends Component {
  state: state = {
    data: []
  }

  async componentDidMount() {
    const response = await get('/aggregate.json');

    // const parsedData = JSON.parse(data.data);

    // const mappedData = response.data.map(({scale, year}: {scale: number, year: string})=>({scale, year: Number(year)}));
    const byYear = buildByYear(response.data);

    console.log('built by year');

    this.setState({
      data: averageByYear(byYear),
      byYear
    })
  }

  render() {
      return (
        <ScatterChart
          width={700}
          height={700}
          margin={{
            top: 20, right: 20, bottom: 20, left: 20,
          }}
        >
          <CartesianGrid />
          <XAxis type="number" dataKey="year" name="year" domain={['dataMin', maxYear]} />
          <YAxis type="number" dataKey="scale" name="scale" />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Scatter name="A school" data={this.state.data} fill="#8884d8" width={1} />
        </ScatterChart>
      );
  }
}

function buildByYear(data: [{scale: number, year: string}]): Map<string, [number]> {
  const result: Map<string, [number]> = new Map();

  data.forEach(({ scale, year }) => {
    if (!result.has(year)) {
      result.set(year, [scale]);
    } else {
      result.get(year).push(scale);
    }
  })

  return result;
}

// used to filter out outliers
const maxScale = 30000000;
const maxYear = 2019;

function averageByYear(byYear: Map<string, [number]>) {
  const result: { year:number, scale:number}[] = [];

  for (let year of byYear.keys()) {
    const scales = byYear.get(year);
    const mean = getMean(scales);

    if (mean > maxScale) continue;

    if (Number(year) >= maxYear) continue;

    result.push({
      year: Number(year),
      scale: mean
    });
  }

  return result;
}

const getMean = (numbers: number[]) => sum(numbers) / numbers.length;

const sum = (numbers: number[]) => numbers.reduce((result, current) => current + result, 0);
