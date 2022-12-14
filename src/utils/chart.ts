import { getHours } from "./drive";
import { shorten } from 'tinyurl'
import { formatNames } from "../messages";
import { LogRow } from "../types";

async function getChartData(names: string[]) {
    const data = await getHours()
    let filtered:LogRow[]
    if (names[0] == 'all') {
        filtered = data
    } else {
        filtered = data.filter(x => names.includes(x.name))
        
    }
    filtered.sort((a, b) => { return a.time_in.getTime() - b.time_in.getTime()})
    const hours = filtered.map(x => x.hours)
    const cumulative_hours = hours.map((_, index) => {
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
    chartData = [chartData[0],...chartData.slice(-80)]; // cap length at 81

    const namestring = formatNames(names)
    return getTimeChartSpecs(namestring, chartData)
}

export async function createChart(names: string[]): Promise<string> {
    const chart = await getChartData(names)
    if (chart == null) {
        throw new Error("No data to chart")
    }
    const full_url = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chart))}&backgroundColor=white`
    const short_url = await shorten(full_url)
    return short_url
}


export function getTimeChartSpecs(name: string, dataList: { x: string, y: string }[]) {
    if (dataList.length == 0) return null
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
            title: { display: true, text: `${name}'s Cumulative Hours!` },
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

