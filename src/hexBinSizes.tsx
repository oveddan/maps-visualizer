import * as d3 from 'd3';
import * as d3Hexbin from 'd3-hexbin';

const width = 800;
const height = Math.max(640, width);

const margin = ({top: 20, right: 20, bottom: 30, left: 40});

const x = d3.scaleLog()
    .domain(d3.extent(data, d => d.x))
    .range([margin.left, width - margin.right])


const hexbin = d3Hexbin.hexbin()
    .x(d => x(d.x))
    .y(d => y(d.y))
    .radius(radius * width / 964)
    .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])

const xAxis = g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(width / 80, ""))
    .call(g => g.select(".domain").remove())
    .call(g => g.append("text")
        .attr("x", width - margin.right)
        .attr("y", -4)
        .attr("fill", "currentColor")
        .attr("font-weight", "bold")
        .attr("text-anchor", "end")
        .text(data.x))


const svgElement = document.getElementsByTagName('svg')[0];

function getChart() {
  const svg = d3.select(svgElement );

  svg.append("g")
      .call(xAxis);

  svg.append("g")
      .call(yAxis);

  svg.append("g")
      .attr("fill", "#ddd")
      .attr("stroke", "black")
    .selectAll("path")
    .data(bins)
    .enter().append(shape)
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .call(shape === "path"
          ? path => path.attr("d", d => hexbin.hexagon(r(d.length)))
          : circle => circle.attr("r", d => r(d.length)));

  return svg.node();
}
