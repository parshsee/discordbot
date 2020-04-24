const fs = require('fs').promises;
const jsonReader = require('./jsonReader');

async function jsonFormatter(file) {
    const jsonArray = await jsonReader(file);

    jsonArray.sort(function(a, b) {
        return a.name.localeCompare(b.name);
    });

    for(i = 0; i < jsonArray.length; i++) {
        jsonArray[i].id = i + 1;
    }

    const jsonString = JSON.stringify(jsonArray, null, 2);

    try {
        await fs.writeFile(file, jsonString);
        return true;
    } catch (err) {
        console.log("Error Formatting/Overwritting File: " + err);
        return false;
    }
}

module.exports = jsonFormatter;