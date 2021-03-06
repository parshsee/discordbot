const fs = require('fs').promises;
const jsonWriter = require('./jsonWriter');
// const gamesJSON = require(gamesFile);
// Require reads file once, requiring it again reads from cache
// Fine for reading static data, but not changes

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

/**
  * When handling errors from async/await functions they need to wrapped in a try/catch block
  *  The callback function doesn't work in async/await so you cant use those
  * https://javascript.info/async-await
  */
async function jsonReader(filePath) {
	//	Check if file exists, if it doesn't and error is thrown which is caught in catch
	//	If the error is ENOENT (it doesn't exist), create the file with [] inside it
	//	to make it a JSON Array
	try {
		await fs.stat(filePath);
	} catch (error) {
		if(error.code === 'ENOENT') {
			await jsonWriter(filePath, JSON.stringify([]));
		}
	}

	const data = await fs.readFile(filePath, 'utf8');
	return JSON.parse(data);
}

module.exports = jsonReader;