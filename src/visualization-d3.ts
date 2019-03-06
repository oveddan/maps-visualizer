import * as d3 from 'd3';
import {scaleDiverging} from 'd3';

const width = 1000;
const height = 800;

const margin = ({top: 20, right: 30, bottom: 30, left: 40});

type Entry = {
  x: number,
  y: number
};

const data: Entry[] = [];

const x = d3.scaleLinear().domain(d3.extent(data, d => d.x)).nice().range([
  margin.left, width - margin.right
])

const y = d3.scaleLinear().domain(d3.extent(data, d => d.y)).nice().range([
  height - margin.bottom, margin.top
]);

const xAxis = g => g.attr('transform', `translate(0,${height - margin.bottom})`)
                       .call(d3.axisBottom(x))
                       .call(g => g.select('.domain').remove())
                       .call(
                           g => g.append('text')
                                    .attr('x', width - margin.right)
                                    .attr('y', -4)
                                    .attr('fill', '#000')
                                    .attr('font-weight', 'bold')
                                    .attr('text-anchor', 'end')
                                    .text(data.x))

type argType = d3.Selection<GElement, Datum, PElement, PDatum>;

const yAxis = (g: d3.Selection<any>) =>
    g.attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
        .call(g => g.select('.domain').remove())
        .call(
            g => g.select('.tick:last-of-type text')
                     .clone()
                     .attr('x', 4)
                     .attr('text-anchor', 'start')
                     .attr('font-weight', 'bold')
                     .text(data.y))



const svgElement = document.getElementsByTagName('svg')[0];
function buildVisualization() {
  const svg = d3.select(svgElement);

  svg.append('g').call(xAxis);

  svg.append('g').call(yAxis);

  svg

  svg.append('g')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 1.5)
      .attr('fill', 'none')
      .selectAll('circle')
      .data(data)
      .join('circle')
      .attr('cx', d => x(d.x))
      .attr('cy', d => y(d.y))
      .attr('r', 2);

  svg.append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 10)
      .selectAll('text')
      .data(data)
      .join('text')
      .attr('x', d => x(d.x))
      .attr('y', d => y(d.y))
      .text(d => d.name)
      .call(dodge);


  return svg.node();
}

function dodge(text, iterations = 300) {
  const nodes = text.nodes();
  const left = text => text.attr('text-anchor', 'start').attr('dy', '0.32em');
  const right = text => text.attr('text-anchor', 'end').attr('dy', '0.32em');
  const top = text => text.attr('text-anchor', 'middle').attr('dy', '0.0em');
  const bottom = text => text.attr('text-anchor', 'middle').attr('dy', '0.8em');
  const points = nodes.map(
      node => ({fx: +node.getAttribute('x'), fy: +node.getAttribute('y')}));
  const labels = points.map(({fx, fy}) => ({x: fx, y: fy}));
  const links = points.map((source, i) => ({source, target: labels[i]}));

  const simulation =
      d3.forceSimulation(points.concat(labels))
          .force('charge', d3.forceManyBody().distanceMax(80))
          .force('link', d3.forceLink(links).distance(4).iterations(4))
          .stop();

  for (let i = 0; i < iterations; ++i) simulation.tick();

  text.attr('x', (_, i) => labels[i].x)
      .attr('y', (_, i) => labels[i].y)
      .each(function(_, i) {
        const a =
            Math.atan2(labels[i].y - points[i].fy, labels[i].x - points[i].fx);
        d3.select(this).call(
            a > Math.PI / 4 && a <= Math.PI * 3 / 4 ?
                bottom :
                a > -Math.PI / 4 && a <= Math.PI / 4 ?
                left :
                a > -Math.PI * 3 / 4 && a <= Math.PI * 3 / 4 ? top : right);
      });
}
