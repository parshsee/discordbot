const fs = require('fs').promises;
//const gamesJSON = require('../games.json');
//Require reads file once, requiring it again reads from cache
//Fine for reading static data, but not changes

/** fs.readFile reads asynchronolously so the next lines of code will execute
    regardless if it's done reading file or not
    fs.readFileSync reads synchronously (waits for it to finish before continuing)
    but this could slow it down if file is large and other people are executing other commands
*/
/** Solution: Using require('fs').promises w/ async/await
    This allowed readFiles to made as a Promise which lets us use 'async' to tell it to 'await'
    until the process is done before returning it and lets it continue doing other commands
    **Note** execute needs to be async and const storing json must make call like
    const varName = await jsonReader(file);

    https://stackoverflow.com/questions/46867517/how-to-read-file-with-async-await-properly
    https://github.com/Keyang/node-csvtojson/issues/278
 */ 
async function jsonReader(filePath) {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
}

module.exports = jsonReader;