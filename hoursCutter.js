export function getHoursCut(hours) {
    let newHours = {data:{}}
    for (let p of Object.entries(hours.data)) {
        let name = p[0];
        let list = p[1];

        let newList = [];
        let lastDayta = null;
        for(let day of list) {
            if((lastDayta?.hours != day?.hours)) {
                if(newList[newList.length-1] != lastDayta) {newList.push(lastDayta)}
                newList.push(day)
            }
            lastDayta = day
        }

        newHours.data[name] = newList;
    }
    return newHours;
}