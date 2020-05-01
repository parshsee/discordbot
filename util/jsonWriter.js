const fs = require('fs').promises;


/**
    Writes the given JSON string into the given filePath
    Overwrites the file if it exists, creates it if it doesn't
    Doesn't need to return anything
    (Log statements don't seem to work regardless of if condition)
 */
async function jsonWriter(filePath, jsonString) {
    await fs.writeFile(filePath, jsonString, err => {
        if(err) {
            console.log('Error Writing File: ', err);
        } else {
            console.log('Successfully wrote file!');
        }
    });
}

module.exports = jsonWriter;