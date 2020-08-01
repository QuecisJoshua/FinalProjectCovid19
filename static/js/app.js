    // set the dimensions and margins of the graph
    var margin = { top: 30, right: 30, bottom: 70, left: 60 },
        width = 960 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3.select("#my_dataviz")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Initialize the X axis
    var x = d3.scaleBand()
        .range([0, width])
        .padding(0.3);
    var xAxis = svg.append("g")
        .attr("class", "myXaxis")
        .attr("transform", "translate(0," + height + ")")

    // Initialize the Y axis
    var y = d3.scaleLinear()
        .range([height, 0]);
    var yAxis = svg.append("g")
        .attr("class", "myYaxis")

// A function that create / update the plot for a given variable:
function buildStateGraph(selectedVar) {

    // Parse the Data
    d3.csv("./static/data/state_data.csv", function (data) {

        // X axis
        x.domain(data.map(function (d) { return d.state; }))
        xAxis.transition().duration(1000).call(d3.axisBottom(x))

        
        svg
            .selectAll("text")
            .attr("transform", "translate(-10,10)rotate(-45)")
            .style("text-anchor", "end")
            .style("font-size", 10)
            .style("fill", "#69a3b2")


        // Add Y axis
        y.domain([0, d3.max(data, function (d) { return +d[selectedVar] })]);
        yAxis.transition().duration(1000).call(d3.axisLeft(y));
        svg
        .selectAll("text")
        .style("font-size", 10)
        .style("fill", "#69a3b2")

        // variable u: map data to existing bars
        var u = svg.selectAll("rect")
            .data(data)

        // update bars
        u
            .enter()
            .append("rect")
            .merge(u)
            .transition()
            .duration(1000)
            .attr("x", function (d) { return x(d.state); })
            .attr("y", function (d) { return y(d[selectedVar]); })
            .attr("width", x.bandwidth())
            .attr("height", function (d) { return height - y(d[selectedVar]); })
            .attr("fill", "#ff7f50")
    })

}

function init() {
    buildStateGraph('confirmed');
}

init();

