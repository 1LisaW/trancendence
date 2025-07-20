import * as d3 from 'd3';

export default class Chart {
  parent: HTMLElement;
  container: HTMLElement;

  constructor(parent: HTMLElement) {
    this.parent = parent;
    parent.innerHTML = '';
    this.container = document.createElement('div');

    const data = [
      {value: 30, color: '#D7FF00', label: 'Label 1'},
      {value: 20, color: '#C3E600', label: 'Label 2'},
      {value: 50, color: '#A3BF00', label: 'Label 3'}
    ];

    this.createDonutChart(data);
  }

  renderChart = (data: { value: number, color: string, label: string }[]) => {
    const container = this.container;
    const margin = 50;
    // const select = d3.select;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    let pieData;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    let animationComplete = false;
    // Define the aspect ratio (width / height) of the chart
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const aspectRatio = 16 / 9;

    // Calculate the size of the chart based on the size of the container
    const containerWidth = this.container.clientWidth;
    const containerHeight = this.container.clientHeight;
    const width = containerWidth - margin * 2;
    const height = containerHeight - margin * 2;
    const radius = Math.min(width, height) / 2;

    const svg = d3.select(this.container)
      .append("svg")
      // Set the width and height to 100% so that the SVG scales to fit its container
      .attr("width", '100%')
      .attr("height", '100%')
      // Set the viewBox attribute to specify the aspect ratio of the SVG
      .attr("viewBox", `0 0 ${width} ${height}`)
      // Set the preserveAspectRatio attribute to make the SVG scale uniformly
      .attr("preserveAspectRatio", "xMinYMin meet");

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    let g = svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const arc = d3.arc()
      .innerRadius(radius * 0.6)
      .outerRadius(radius);

    const pie = d3.pie()
      .sort(null)
      // TODO check
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .value(d => (d as any).value);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    pieData = pie(data);

    const path = g.selectAll("path")
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .data(pie(data))
      .join("path")
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .attr("fill", (d, i) => d.data.color)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .attr("d", arc)
      .each(function () {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this as any)._current = {startAngle: 0, endAngle: 0};
      });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    let text;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    let value;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    function animate(onComplete) {
      path.transition()
        .duration(1500)
        .attrTween("d", function (d) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const interpolate = d3.interpolate(this._current, d);
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          this._current = interpolate(0);
          return function (t) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return arc(interpolate(t));
          };
        })
        .on("end", function () {
          animationComplete = true;
          onComplete();
          allowHover();
        });

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      text.transition()
        .duration(2000)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        .attrTween("transform", function (d) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const interpolate = d3.interpolate(this._current, d);
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          this._current = interpolate(0);
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          return function (t) {
            return `translate(${arc.centroid(interpolate(t))})`;
          };
        });

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      value.transition()
        .duration(2000)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        .tween("text", function (d) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const i = d3.interpolate(this.textContent, d.data.value);
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          return function (t) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            this.textContent = Math.round(i(t));
          };
        })
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        .attrTween("transform", function (d) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const interpolate = d3.interpolate(this._current, d);
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          this._current = interpolate(0);
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          return function (t) {
            return `translate(${arc.centroid(interpolate(t))})`;
          };
        });
    }

    function addLabels() {
      text = g.selectAll("text")
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        .data(pie(data))
        .join("text")
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .attr("dy", "-0.5em")
        .attr("text-anchor", "middle")
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        .text(d => d.data.label)
        .classed("label", true);

      value = g.selectAll("text.value")
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        .data(pie(data))
        .join("text")
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .attr("dy", "0.5em")
        .attr("text-anchor", "middle")
        .classed("value", true);
    }

    function addDataValues() {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      value.each(function (d) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        d3.select(this).text(d.data.value);
      });
    }


    function allowHover() {
      const path = container.querySelectorAll("path");
      container.querySelectorAll("g");
      let currentHover: SVGPathElement | null = null;

      path.forEach(function (p) {
        p.addEventListener("mouseover", function () {
          if (currentHover !== this) {
            const scaleFactor = 1.05;

            // Set the fill of all other paths to grey
            path.forEach(function (p2) {
              if (p2 !== p) {
                d3.select(p2)
                  .transition()
                  .duration(500)
                  .attr("transform", `scale(1)`);
              }
            });

            // Scale up the hovered path and set its fill color to its original color
            d3.select(this)
              .transition()
              .duration(500)
              .attr("transform", `scale(${scaleFactor})`)

            // eslint-disable-next-line @typescript-eslint/no-this-alias
            currentHover = this;
          }
        });

        p.addEventListener("mouseout", function () {
          if (currentHover === this) {
            const scaleFactor = 1;

            // Set the fill of all paths back to their original color
            path.forEach(function (p2) {
              d3.select(p2)
                .transition()
                .duration(500)
                .attr("transform", `scale(1)`);
            });

            // Scale down the path to its original size and set its fill color back to its original color
            d3.select(this)
              .transition()
              .duration(500)
              .attr("transform", `scale(${scaleFactor})`)

            currentHover = null;
          }
        });
      });
    }

    addLabels(); // Call `addLabels` before `animate`

    function animateChart() {
      animate(() => {
        addLabels();
        addDataValues();
        allowHover();
      });
    }

    function isVisible(elem: Element) {
      const rect = elem.getBoundingClientRect();
      const windowHeight = (window.innerHeight || document.documentElement.clientHeight);
      return rect.top <= windowHeight && rect.bottom >= 0;
    }

    // function onScroll() {
    //   if (isVisible(container)) {
    //     window.removeEventListener('scroll', onScroll);
    //     animate(() => {
    //     });
    //     //allowHover();
    //   }
    // }

    if (isVisible(container)) {
      animateChart(); // Call animateChart directly if the chart is visible
    } else {
      window.addEventListener('scroll', function onScroll() {
        if (isVisible(container)) {
          animateChart(); // Call animateChart when the chart becomes visible
          window.removeEventListener('scroll', onScroll);
        }
      });
    }
  }

  createDonutChart = (data: { value: number, color: string, label: string }[]) => {
    // Wait for the container element to be fully rendered
    requestAnimationFrame(() => {
      this.renderChart(data);
    });
  }

}
