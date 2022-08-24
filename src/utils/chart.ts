import { getHours } from "./drive";
import { shorten } from 'tinyurl'
import { formatNames } from "../handlers";

async function getChartData(names: string[]) {
    let data = await getHours()
    let filtered
    if (names[0] == 'all') {
        filtered = data
    } else {
        filtered = data.filter(x => names.includes(x.name))
    }
    let hours = filtered.map(x => x.hours)
    let cumulative_hours = hours.map((_, index) => {
        let sum = 0
        hours.slice(0, index).forEach(y => { sum += y })
        return sum
    })
    let chartData = filtered.map((x, index) => {
        return {
            x: x.time_in.toDateString(),
            y: cumulative_hours[index].toFixed(1)
        }
    })
    let namestring = formatNames(names)
    return getTimeChartSpecs(namestring, chartData)
}

export async function createChart(names: string[]): Promise<string> {
    let chart = await getChartData(names)
    let full_url = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chart))}&backgroundColor=white`
    let short_url = await shorten(full_url)
    return short_url
}


export function getTimeChartSpecs(name: string, dataList: { x: string, y: string }[]) {
    return {
        type: 'line',

        data: {
            datasets: [{
                // label: 'Hours',
                data: dataList,
                lineTension: 1,
                cubicInterpolationMode: "monotone",
                borderWidth: 5,
                fill: true,
                pointRadius: 0,
                // steppedLine: false,
                borderColor: "#29d9b9",
                backgroundColor: "#29d9b933",
                // pointHitRadius:2,
                pointBorderWidth: 0,
            }]
        },
        options: {
            legend: { display: false },
            title: { display: true, text: `${name}\'s Cumulative Hours` },
            subtitle: { display: true, text: `${(new Date(dataList[0].x)).toDateString()} - ${(new Date(dataList[dataList.length - 1].x)).toDateString()}` },
            scales: {
                xAxes: [{
                    type: 'time',
                    // distribution: 'linear',
                    time: {
                        unit: 'day',
                    }
                    
                }], 
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Hours'
                    }
                }]
            
            }
        }
    }
}

