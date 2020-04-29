const fs = require('fs').promises;
const jsonReader = require('./jsonReader');
const jsonWriter = require('./jsonWriter');

/** 
 *  Takes the given filePath and reads it, getting a jsonArray
 *  Sorts the array alphabetically based on name
 *  Loops through the array and updates the ids for every object (couldn't find a way to do it in sort)
 *  Turns the array into a jsonString ---- Needed to write to file (otherwise get [object Object])
 *  Writes the jsonString back to the filePath, since it exists it overwrites the exisiting file
    https://medium.com/@osiolabs/read-write-json-files-with-node-js-92d03cc82824
    https://stackoverflow.com/questions/35576041/sort-json-by-value/35576179
*/
async function jsonFormatter(filePath) {
    const jsonArray = await jsonReader(filePath);

    jsonArray.sort(function(a, b) {
        return a.name.localeCompare(b.name);
    });

    for(i = 0; i < jsonArray.length; i++) {
        jsonArray[i].id = i + 1;
    }

    const jsonString = JSON.stringify(jsonArray, null, 2);

    await jsonWriter(filePath, jsonString);
}

module.exports = jsonFormatter;