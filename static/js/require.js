async function fetchCSVData(url) {
  const response = await fetch(url);
  const data = await response.text();
  return data;
}

async function scatterBubbleChart(data, title, num) {
  const pdf = Plotly.d3.csv.parse(data);

  // Map data for the trace

  const yData = pdf.map((row) => parseInt(row.Installs));

  const appSize = pdf.map((row) => parseInt(row.App));

  const maxAppSize = Math.max(...appSize);

  const colorData = yData;
  const sizeData = appSize;
  const categoryData = pdf.map((row) => row.Category);

  const desired_maximum_marker_size = 20;
  const max_size = Math.max(...appSize);
  const sizeref = (2.0 * max_size) / desired_maximum_marker_size ** 2;

  const scatter = {
    trace: {
      x: appSize,
      y: yData,
      mode: "markers",
      type: "scatter",
      text: categoryData,
      marker: {
        color: colorData,
        size: sizeData,
        colorscale: "YlOrRd",
        sizemode: "area",
        hovertemplate: `%{text}`,
        sizeref: sizeref,
        showscale: true,
      },
    },
    layout: {
      resolution: { dpi: 120 },
      title: title,
      xaxis: {
        title: "Number of Apps (Lower=More Concentrated)",
        showgrid: true,
        showline: true,
        linewidth: 1,
        linecolor: "black",
        mirror: true,
        range: [0, maxAppSize + 0.1 * maxAppSize],
      },
      yaxis: {
        type: "log",
        title: "Installs",
        showgrid: true,
        showline: true,
        linewidth: 1,
        linecolor: "black",
        mirror: true,
      },
      plot_bgcolor: "rgb(229, 236, 246)",
      font: {
        family: "Verdana",
      },
      autosize: true,
    },
    config: {
      responsive: true,
    },
  };
  const bubbleElement = document.getElementById(`chart${num}`);

  Plotly.plot(bubbleElement, [scatter.trace], scatter.layout, scatter.config);
}

async function pieChart(title, vKey, lKey, hole, num) {
  const contentRatings = await fetchCSVData(
    "static/assets/csv/content_ratings.csv"
  );
  const pdf = Plotly.d3.csv.parse(contentRatings);

  const values = pdf.map((row) => row[vKey]);
  const labels = pdf.map((row) => row[lKey]);

  const pie = {
    trace: {
      type: "pie",
      values: values,
      labels: labels,
      names: labels,
      textinfo: "percent",
      textposition: "outside",
      hole: `${hole}`,
    },
    layout: {
      resolution: { dpi: 120 },
      title: `${title}`,
      font: {
        family: "Verdana",
      },
      autosize: true,
    },
    config: {
      responsive: true,
    },
  };

  const pieElement = document.getElementById(`chart${num}`);

  if (pieElement.data) {
    Plotly.purge(pieElement.data);
    Plotly.newPlot(pieElement, [pie.trace], pie.layout, pie.config);
    return;
  }

  Plotly.newPlot(pieElement, [pie.trace], pie.layout, pie.config);
}

async function barChart(
  data,
  title,
  xKey,
  yKey,
  isXValInt,
  isYValInt,
  isContScale,
  orient,
  height,
  yStep,
  xlabel,
  ylabel,
  mc,
  bg,
  num
) {
  const pdf = Plotly.d3.csv.parse(data);
  let xValues, yValues;

  xValues = pdf.map((row) => (isXValInt ? parseInt(row[xKey]) : row[xKey]));

  yValues = pdf.map((row) => (isYValInt ? parseInt(row[yKey]) : row[yKey]));

  const bar = {
    trace: {
      type: "bar",
      x: xValues,
      y: yValues,
      orientation: orient,
      marker: isContScale
        ? { color: yValues, colorscale: "Agsunset" }
        : {
            color: mc,
          },
    },
    layout: {
      title: title,
      xaxis: isXValInt
        ? {
            title: xlabel,
          }
        : {},
      yaxis: isYValInt
        ? {
            title: ylabel,
            showgrid: true,
            tick0: 0,
            dtick: yStep,
          }
        : {
            showgrid: true,
          },
      margin: isYValInt
        ? isXValInt
          ? {}
          : { b: 100 }
        : isXValInt
        ? { l: 175 }
        : { b: 100, l: 175 },
      font: {
        family: "Verdana",
      },
      height: height,
      plot_bgcolor: bg,
      autosize: true,
    },
    config: {
      responsive: true,
    },
  };

  const barElement = document.getElementById(`chart${num}`);

  Plotly.newPlot(barElement, [bar.trace], bar.layout, bar.config);
}

async function barGroupChart(
  data,
  title,
  xKey,
  yKey,
  isXValInt,
  isYValInt,
  yGroupKey,
  yCond1Key,
  yCond2Key,
  isContScale,
  orient,
  height,
  isYLog,
  xlabel,
  ylabel,
  mc1,
  mc2,
  bg,
  num
) {
  const pdf = Plotly.d3.csv.parse(data);

  let y1Values, y2Values;
  let previousRow = null;

  let xValues = pdf
    .filter((row) => {
      const isDifferentRow = row[xKey] !== previousRow;
      previousRow = row[xKey];
      return isDifferentRow;
    })
    .map((row) => (isXValInt ? parseInt(row[xKey]) : row[xKey]));

  // Create an object to store the rows, with xKey as the key
  const rowsObj = {};
  pdf.forEach((row) => {
    const xValue = row[xKey];
    if (!rowsObj[xValue]) {
      rowsObj[xValue] = [];
    }
    rowsObj[xValue].push(row);
  });

  y1Values = [];
  y2Values = [];

  // Loop over the unique xValues
  Object.keys(rowsObj).forEach((xValue) => {
    const rows = rowsObj[xValue];
    if (rows.length === 2) {
      rows.forEach((row) => {
        if (row[yGroupKey] === yCond1Key) {
          y1Values.push(isYValInt ? parseInt(row[yKey]) : row[yKey]);
        } else {
          y2Values.push(isYValInt ? parseInt(row[yKey]) : row[yKey]);
        }
      });
    } else {
      const row = rows[0];
      if (row[yGroupKey] === yCond1Key) {
        y1Values.push(isYValInt ? parseInt(row[yKey]) : row[yKey]);
        y2Values.push(0);
      } else {
        y1Values.push(0);
        y2Values.push(isYValInt ? parseInt(row[yKey]) : row[yKey]);
      }
    }
  });

  const bar = {
    trace: [
      {
        type: "bar",
        x: xValues,
        y: y1Values,
        name: yCond1Key,
        orientation: orient,
        marker: isContScale
          ? { color: y1Values, colorscale: "Agsunset" }
          : {
              color: mc1,
            },
        hoverinfo: "y",
      },
      {
        type: "bar",
        x: xValues,
        y: y2Values,
        name: yCond2Key,
        orientation: orient,
        marker: isContScale
          ? { color: y2Values, colorscale: "Agsunset" }
          : {
              color: mc2,
            },
        hoverinfo: "y",
      },
    ],
    layout: {
      title: title,
      xaxis: isXValInt
        ? {
            title: xlabel ? xlabel : null,
          }
        : { categoryorder: "total descending" },
      yaxis: isYValInt
        ? {
            title: ylabel ? ylabel : null,
            showgrid: true,
            tick0: 0,
            dtick: isYLog ? null : 200,
            type: isYLog ? "log" : null,
          }
        : {
            showgrid: true,
            type: isYLog ? "log" : null,
          },
      height: height,
      barmode: "group",
      margin: isYValInt
        ? isXValInt
          ? {}
          : { b: 175 }
        : isXValInt
        ? { l: 175 }
        : { b: 175, l: 175 },
      font: {
        family: "Verdana",
      },
      plot_bgcolor: `${bg}`,
      autosize: true,
    },
    config: {
      responsive: true,
    },
  };

  const barGroupElement = document.getElementById(`chart${num}`);

  Plotly.newPlot(barGroupElement, bar.trace, bar.layout, bar.config);
}

async function boxChartTwo(
  data,
  title,
  yKey,
  isYValInt,
  yGroupKey,
  yCond1Key,
  yCond2Key,
  height,
  isYLog,
  xlabel,
  ylabel,
  mc1,
  mc2,
  bg,
  num
) {
  const pdf = Plotly.d3.csv.parse(data);

  let y1Values = pdf
    .filter((d) => d[yGroupKey] === yCond1Key)
    .map((d) => (isYValInt ? parseInt(d[yKey]) : d[yKey]));
  let y2Values = pdf
    .filter((d) => d[yGroupKey] === yCond2Key)
    .map((d) => (isYValInt ? parseInt(d[yKey]) : d[yKey]));

  const trace1 = {
    y: y1Values,
    name: yCond1Key,
    type: "box",
    boxpoints: "all",
    notched: true,
    marker: {
      color: mc1,
    },
  };

  const trace2 = {
    y: y2Values,
    name: yCond2Key,
    type: "box",
    boxpoints: "all",
    notched: true,
    marker: {
      color: mc2,
    },
  };

  const box = {
    trace: [trace1, trace2],
    layout: {
      title: title,
      xaxis: {
        title: xlabel,
      },
      yaxis: isYValInt
        ? {
            title: ylabel ? ylabel : null,
            showgrid: true,
            tick0: 0,
            dtick: isYLog ? null : 200,
            type: isYLog ? "log" : null,
          }
        : {
            showgrid: true,
            type: isYLog ? "log" : null,
          },
      font: {
        family: "Verdana",
      },
      height: height,
      plot_bgcolor: bg,
      autosize: true,
    },
    config: {
      responsive: true,
    },
  };

  const boxElement = document.getElementById(`chart${num}`);

  Plotly.newPlot(boxElement, box.trace, box.layout, box.config);
}

async function boxChartGroup(
  data,
  title,
  yKey,
  isXValInt,
  isYValInt,
  categoryOrder,
  yGroupKey,
  height,
  isYLog,
  xlabel,
  ylabel,
  mc,
  bg,
  num
) {
  const pdf = Plotly.d3.csv.parse(data);

  // Group data by category
  const categories = [...new Set(pdf.map((d) => d[yGroupKey]))];

  const traces = categories.map((category) => {
    const category_data = pdf
      .filter((d) => d[yGroupKey] === category)
      .map((d) => (isYValInt ? parseInt(d[yKey]) : d[yKey]));
    return {
      x: Array(category_data.length).fill(category),
      y: category_data,
      name: category,
      type: "box",
      boxpoints: "all",
      marker: {
        color: mc,
      },
      showlegend: false,
    };
  });

  const box = {
    layout: {
      title: title,
      xaxis: isXValInt
        ? {
            title: xlabel ? xlabel : null,
          }
        : { categoryorder: categoryOrder },
      yaxis: isYValInt
        ? {
            title: ylabel ? ylabel : null,
            showgrid: true,
            tick0: 0,
            dtick: isYLog ? null : 200,
            type: isYLog ? "log" : null,
          }
        : {
            showgrid: true,
            type: isYLog ? "log" : null,
          },
      margin: isYValInt
        ? isXValInt
          ? {}
          : { b: 175 }
        : isXValInt
        ? { l: 175 }
        : { b: 175, l: 175 },
      font: {
        family: "Verdana",
      },
      height: height,
      plot_bgcolor: bg,
      autosize: true,
    },
    config: {
      responsive: true,
    },
  };

  const boxElement = document.getElementById(`chart${num}`);

  Plotly.newPlot(boxElement, traces, box.layout, box.config);
}
async function main() {
  const startTime = performance.now();
  try {
    const valueCount = await fetchCSVData("static/assets/csv/value_counts.csv");
    const categoryInstalls = await fetchCSVData(
      "static/assets/csv/category_installs.csv"
    );
    const categoryConcentration = await fetchCSVData(
      "static/assets/csv/category_concentration.csv"
    );
    const appsGenre = await fetchCSVData(
      "static/assets/csv/competition_genres.csv"
    );
    const appsFreePaid = await fetchCSVData(
      "static/assets/csv/freeandpaidapps.csv"
    );

    const appsFreePaidBox = await fetchCSVData(
      "static/assets/csv/freeandpaidappsboxplot.csv"
    );

    const appsPaidBox = await fetchCSVData(
      "static/assets/csv/paidappsboxplot.csv"
    );

    // Run plotting functions concurrently
    await Promise.all([
      pieChart("Content Rating", "count", "Content_Rating", 0, 1),
      barChart(
        valueCount,
        "Analysing App Categories",
        "Category",
        "count",
        false,
        true,
        false,
        "v",
        500,
        200,
        false,
        "Apps in Category",
        "rgb(100, 114, 246)",
        "rgb(229, 236, 246)",
        2
      ),
      barChart(
        categoryInstalls,
        "Category Popularity",
        "Installs",
        "Category",
        true,
        false,
        false,
        "h",
        525,
        200,
        "Installs",
        "Category",
        "rgb(100, 114, 246)",
        "rgb(229, 236, 246)",
        3
      ),
      scatterBubbleChart(categoryConcentration, "Category Concentration", 4),
      barChart(
        appsGenre,
        "Top Genres",
        "Genre",
        "count",
        false,
        true,
        true,
        "v",
        475,
        100,
        "Genre",
        "Number of Apps",
        "rgb(100, 114, 246)",
        "rgb(229, 236, 246)",
        5
      ),
      barGroupChart(
        appsFreePaid,
        "Free vs Paid Apps by Category",
        "Category",
        "App",
        false,
        true,
        "Type",
        "Free",
        "Paid",
        false,
        "v",
        600,
        true,
        false,
        "Number of Apps",
        "rgb(100, 114, 246)",
        "rgb(237, 86, 66)",
        "rgb(229, 236, 246)",
        6
      ),
      boxChartTwo(
        appsFreePaidBox,
        "How Many Downloads are Paid Apps Giving Up?",
        "Installs",
        true,
        "Type",
        "Free",
        "Paid",
        475,
        true,
        "Type",
        "Installs",
        "rgb(100, 114, 246)",
        "rgb(237, 86, 66)",
        "rgb(229, 236, 246)",
        7
      ),
      boxChartGroup(
        appsPaidBox,
        "How Much Can Paid Apps Earn?",
        "Revenue_Estimate",
        false,
        true,
        "min ascending",
        "Category",
        575,
        true,
        "Category",
        "Paid App Ballpark Revenue",
        "rgb(164, 175, 245)",
        "rgb(229, 236, 246)",
        8
      ),
      boxChartGroup(
        appsPaidBox,
        "Paid Apps Price per Category",
        "Price",
        false,
        true,
        "max descending",
        "Category",
        575,
        true,
        "Category",
        "Paid App Price",
        "rgb(164, 175, 245)",
        "rgb(229, 236, 246)",
        9
      ),
    ]);
  } catch (error) {
    console.error("Error loading or plotting data:", error);
  } finally {
    const endTime = performance.now();
    console.log(`Execution time: ${endTime - startTime}ms`);
  }
}

document.addEventListener("DOMContentLoaded", main);

const pieButton = document.getElementById("processpie");
const donutButton = document.getElementById("processdonut");
const donutSize = document.getElementById("donut");

pieButton.addEventListener("click", function () {
  pieChart("Content Rating", "count", "Content_Rating", 0, 1);
});
donutButton.addEventListener("click", function () {
  let hole = 0.5;
  const holeInput = parseFloat(donutSize.value);
  if (holeInput === 0) {
    pieChart("Content Rating", "count", "Content_Rating", hole, 1);
    return;
  }
  hole = holeInput;
  pieChart("Content Rating", "count", "Content_Rating", hole, 1);
});
