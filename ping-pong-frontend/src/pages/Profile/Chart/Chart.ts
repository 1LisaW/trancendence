// import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// export default class Chart {
//     parent: HTMLElement;
//     container: HTMLElement;
//     constructor(parent: HTMLElement) {
//         this.parent = parent;
//         parent.innerHTML = '';
//         this.container = document.createElement('div');

//         const data = [
//             { value: 30, color: '#D7FF00', label: 'Label 1' },
//             { value: 20, color: '#C3E600', label: 'Label 2' },
//             { value: 50, color: '#A3BF00', label: 'Label 3' }
//         ];

//         this.createDonutChart(data);
//     }

//     renderChart = (data) => {
//         const container = this.container;
//         const margin = 50;
//         // const select = d3.select;

//         let pieData;
//         let animationComplete = false;
//             // Define the aspect ratio (width / height) of the chart
//             const aspectRatio = 16 / 9;

//             // Calculate the size of the chart based on the size of the container
//             const containerWidth = this.container.clientWidth;
//             const containerHeight = this.container.clientHeight;
//             const width = containerWidth - margin * 2;
//             const height = containerHeight - margin * 2;
//             const radius = Math.min(width, height) / 2;

//             const svg = d3.select(this.container)
//                 .append("svg")
//                 // Set the width and height to 100% so that the SVG scales to fit its container
//                 .attr("width", '100%')
//                 .attr("height", '100%')
//                 // Set the viewBox attribute to specify the aspect ratio of the SVG
//                 .attr("viewBox", `0 0 ${width} ${height}`)
//                 // Set the preserveAspectRatio attribute to make the SVG scale uniformly
//                 .attr("preserveAspectRatio", "xMinYMin meet");

//             let g = svg.append('g')
//                 .attr('transform', `translate(${width / 2}, ${height / 2})`);

//             const arc = d3.arc()
//                 .innerRadius(radius * 0.6)
//                 .outerRadius(radius);

//             const pie = d3.pie()
//                 .sort(null)
//                 .value(d => d.value);

//             pieData = pie(data);

//             const path = g.selectAll("path")
//                 .data(pie(data))
//                 .join("path")
//                 .attr("fill", (d, i) => d.data.color)
//                 .attr("d", arc)
//                 .each(function () { this._current = { startAngle: 0, endAngle: 0 }; });

//             function animate(onComplete) {
//                 path.transition()
//                     .duration(1500)
//                     .attrTween("d", function (d) {
//                         const interpolate = d3.interpolate(this._current, d);
//                         this._current = interpolate(0);
//                         return function (t) {
//                             return arc(interpolate(t));
//                         };
//                     })
//                     .on("end", function () {
//                         animationComplete = true;
//                         onComplete();
//                         allowHover();
//                     });

//                 text.transition()
//                     .duration(2000)
//                     .attrTween("transform", function (d) {
//                         const interpolate = d3.interpolate(this._current, d);
//                         this._current = interpolate(0);
//                         return function (t) {
//                             return `translate(${arc.centroid(interpolate(t))})`;
//                         };
//                     });

//                 value.transition()
//                     .duration(2000)
//                     .tween("text", function (d) {
//                         const i = d3.interpolate(this.textContent, d.data.value);
//                         return function (t) {
//                             this.textContent = Math.round(i(t));
//                         };
//                     })
//                     .attrTween("transform", function (d) {
//                         const interpolate = d3.interpolate(this._current, d);
//                         this._current = interpolate(0);
//                         return function (t) {
//                             return `translate(${arc.centroid(interpolate(t))})`;
//                         };
//                     });
//             }

//             let text;
//             let value;

//             function addLabels() {
//                 text = g.selectAll("text")
//                     .data(pie(data))
//                     .join("text")
//                     .attr("transform", d => `translate(${arc.centroid(d)})`)
//                     .attr("dy", "-0.5em")
//                     .attr("text-anchor", "middle")
//                     .text(d => d.data.label)
//                     .classed("label", true);

//                 value = g.selectAll("text.value")
//                     .data(pie(data))
//                     .join("text")
//                     .attr("transform", d => `translate(${arc.centroid(d)})`)
//                     .attr("dy", "0.5em")
//                     .attr("text-anchor", "middle")
//                     .classed("value", true);
//             }

//             function addDataValues() {
//                 value.each(function (d) {
//                     d3.select(this).text(d.data.value);
//                 });
//             }


//             function allowHover() {
//                 const path = container.querySelectorAll("path");
//                 const g = container.querySelectorAll("g");
//                 let currentHover = null;

//                 path.forEach(function (p) {
//                     p.addEventListener("mouseover", function (event) {
//                         if (currentHover !== this) {
//                             const scaleFactor = 1.05;

//                             // Set the fill of all other paths to grey
//                             path.forEach(function (p2) {
//                                 if (p2 !== p) {
//                                     d3.select(p2)
//                                         .transition()
//                                         .duration(500)
//                                         .attr("transform", `scale(1)`);
//                                 }
//                             });

//                             // Scale up the hovered path and set its fill color to its original color
//                             d3.select(this)
//                                 .transition()
//                                 .duration(500)
//                                 .attr("transform", `scale(${scaleFactor})`)

//                             currentHover = this;
//                         }
//                     });

//                     p.addEventListener("mouseout", function (event) {
//                         if (currentHover === this) {
//                             const scaleFactor = 1;

//                             // Set the fill of all paths back to their original color
//                             path.forEach(function (p2) {
//                                 d3.select(p2)
//                                     .transition()
//                                     .duration(500)
//                                     .attr("transform", `scale(1)`);
//                             });

//                             // Scale down the path to its original size and set its fill color back to its original color
//                             d3.select(this)
//                                 .transition()
//                                 .duration(500)
//                                 .attr("transform", `scale(${scaleFactor})`)

//                             currentHover = null;
//                         }
//                     });
//                 });
//             }

//             addLabels(); // Call `addLabels` before `animate`

//             function animateChart() {
//                 animate(() => {
//                     addLabels();
//                     addDataValues();
//                     allowHover();
//                 });
//             }

//             function isVisible(elem) {
//                 const rect = elem.getBoundingClientRect();
//                 const windowHeight = (window.innerHeight || document.documentElement.clientHeight);
//                 return rect.top <= windowHeight && rect.bottom >= 0;
//             }

//             function onScroll() {
//                 if (isVisible(container)) {
//                     window.removeEventListener('scroll', onScroll);
//                     animate(()=>{});
//                     //allowHover();
//                 }
//             }

//             if (isVisible(container)) {
//                 animateChart(); // Call animateChart directly if the chart is visible
//             } else {
//                 window.addEventListener('scroll', function onScroll() {
//                     if (isVisible(container)) {
//                         animateChart(); // Call animateChart when the chart becomes visible
//                         window.removeEventListener('scroll', onScroll);
//                     }
//                 });
//             }
//     }

//     createDonutChart = (data:{value: number, color: string, label:string}[]) => {
//         // Wait for the container element to be fully rendered
//         requestAnimationFrame(() => {
//             this.renderChart(data);
//         });
//     }


// }