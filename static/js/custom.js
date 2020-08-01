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
        .then(function (response) {
            if (response.status !== 200) {
                console.log("Response was not 200")
                return;
            }

            response.json().then(function (data) {
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
