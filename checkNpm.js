import fetch from 'node-fetch';
import fs from 'fs';
import csv from 'csv-parser';

const args = process.argv.slice(2);
const filePath = args[0];

if (!filePath) {
    console.log("Please provide a file path.");
    process.exit(1);
}

let packageList = [];

// Function to get the latest version of a package from npm
async function getLatestVersion(packageName) {
  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data['dist-tags'] ? data['dist-tags'].latest : 'Not found';
  } catch (error) {
    console.error(`Error fetching version for ${packageName}: ${error.message}`);
    return 'Error';
  }
}

// Read package names from the provided file path
fs.createReadStream(filePath)
  .pipe(csv())
  .on('data', (row) => {
    packageList.push(row.package);
  })
  .on('end', async () => {
    console.log('CSV file successfully processed');
    for (const packageName of packageList) {
      const latestVersion = await getLatestVersion(packageName);
      console.log(`Latest version of ${packageName} is ${latestVersion}`);
    }
  });
