// This example requires the Visualization library. Include the libraries=visualization
// parameter when you first load the API. For example:
// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=visualization">
"use strict";

let map, heatmap, returnString;

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 4.5,
        center: {
            lat: 40,
            lng: -97
        },
        mapTypeId: "roadmap"
    });
    heatmap = new google.maps.visualization.HeatmapLayer({
        data: getreturnstring(),
        map: map
    });
    changeRadius();
    changeOpacity();
    changeGradient();
}

function getreturnstring() {
    returnString = [];
    d3.csv("./static/data/state_data.csv", function(data) {
        data.forEach(function(d) {
            let coordinates = {
                'location': new google.maps.LatLng(parseFloat(d.lat), parseFloat(d.long)),
                'weight': parseFloat(d.deaths)
            }
            returnString.push(coordinates);
        });
    });
    return returnString;
}

function toggleHeatmap() {
    heatmap.setMap(heatmap.getMap() ? null : map);
}

function changeGradient() {
    const gradient = [
        "rgba(0, 255, 255, 0)",
        "rgba(0, 255, 255, 1)",
        "rgba(0, 191, 255, 1)",
        "rgba(0, 127, 255, 1)",
        "rgba(0, 63, 255, 1)",
        "rgba(0, 0, 255, 1)",
        "rgba(0, 0, 223, 1)",
        "rgba(0, 0, 191, 1)",
        "rgba(0, 0, 159, 1)",
        "rgba(0, 0, 127, 1)",
        "rgba(63, 0, 91, 1)",
        "rgba(127, 0, 63, 1)",
        "rgba(191, 0, 31, 1)",
        "rgba(255, 0, 0, 1)"
    ];
    heatmap.set("gradient", heatmap.get("gradient") ? null : gradient);
}

function changeRadius() {
    heatmap.set("radius", heatmap.get("radius") ? null : 20);
}

function changeOpacity() {
    heatmap.set("opacity", heatmap.get("opacity") ? null : 0.2);
} // Heatmap data: 500 Points



function submit_entry() {
    var fromdate = document.getElementById("txtfromdate");
    var todate = document.getElementById("txttodate");
    var county = document.getElementById("txtcounty");
    var state = document.getElementById("txtstate");

    var entry = {
        fromdate: fromdate.value,
        todate: todate.value,
        county: county.value,
        state: state.value
    };

    fetch(`${window.origin}/custom/Search`, {
            method: "POST",
            credentials: "include",
            body: JSON.stringify(entry),
            cache: "no-cache",
            headers: new Headers({
                "content-type": "application/json"
            })
        })
        .then(function(response) {
            if (response.status !== 200) {
                console.log("Response was not 200")
                return;
            }

            response.json().then(function(data) {
                var dates = [];
                var confirmed = [];
                var deaths = [];
                var active = [];
                var text = [];

                data.forEach(obj => {
                    Object.entries(obj).forEach(([key, value]) => {

                        if (key == "datadate") {
                            dates.push(value);
                        }

                        if (key == "confirmed") {
                            confirmed.push(value);
                        }

                        if (key == "deaths") {
                            deaths.push(value);
                        }

                        if (key == "active") {
                            active.push(value);
                        }

                        if (key == "uscounty") {
                            text.push(value);
                        }
                    });
                });

                var trace_confirmed = {
                    x: dates,
                    y: confirmed,
                    name: 'Confirmed Cases',
                    type: "bar",
                };

                var trace_active = {
                    x: dates,
                    y: active,
                    name: 'Active Cases',
                    type: "bar",
                };

                var data_first_graph = [trace_confirmed, trace_active];

                var layout_first_graph = {
                    title: "Confirmed Cases Vs. Active Cases",
                    barmode: 'group'
                };

                Plotly.newPlot("bar_confirmed_active", data_first_graph, layout_first_graph);

                var trace_deaths = {
                    x: deaths,
                    y: dates,
                    name: 'COVID Deaths',
                    type: "bar",
                    orientation: "h"
                };

                var data_second_graph = [trace_deaths];

                var layout_second_graph = {
                    title: "Deaths due COVID-19",
                };

                Plotly.newPlot("bar_deaths", data_second_graph, layout_second_graph);

            })
        })
}
