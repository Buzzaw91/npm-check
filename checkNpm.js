import { createReadStream } from 'fs';
import csv from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';

const args = process.argv.slice(2);
const filePath = args[0];

if (!filePath) {
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

createReadStream(filePath)
  .pipe(csv())
  .on('data', (row) => {
    packages.push({ package: row.package, oldVersion: row['Old-Version'], newVersion: row['New-Version'] });
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
  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: [
      {id: 'package', title: 'package'},
      {id: 'oldVersion', title: 'old-version'},
      {id: 'newVersion', title: 'new-version'}
    ],
    append: false
  });

  csvWriter.writeRecords(packages)
    .then(() => {
      console.log('CSV file updated successfully');
    });
}
