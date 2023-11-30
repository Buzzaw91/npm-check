import { createReadStream } from 'fs';
import csv from 'csv-parser';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';

const args = process.argv.slice(2);
const inputFilePath = args[0];
const outputFilePath = inputFilePath.replace('.csv', '_updated_deps.csv');

if (!inputFilePath) {
    console.log("Please provide a file path.");
    process.exit(1);
}

let packages = []; // Array to store package data

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

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

createReadStream(inputFilePath)
  .pipe(csv())
  .on('data', (row) => {
    packages.push({ package: row.package, oldVersion: row['old-version'], newVersion: '' });
  })
  .on('end', async () => {
    console.log('CSV file successfully processed');
    for (const pkg of packages) {
      pkg.newVersion = await getLatestVersion(pkg.package);
      console.log(`Latest version of ${pkg.package} is ${pkg.newVersion}`);
    }
    writeUpdatedCsv();
  });

function writeUpdatedCsv() {
  const csvWriter = createCsvWriter({
    path: outputFilePath,
    header: [
      {id: 'package', title: 'Package'},
      {id: 'oldVersion', title: 'Old-Version'},
      {id: 'newVersion', title: 'New-Version'}
    ]
  });

  csvWriter.writeRecords(packages)
    .then(() => {
      console.log('New CSV file written successfully');
    });
}
