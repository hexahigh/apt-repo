import fs from 'fs';
import path from 'path';

const iconPack = "material"
const title = "Boofdev's apt repo"
const extraCSS = "body { background-color: #000000; color: #ffffff; }"
const extraJS = ""

function bytesToSize(bytes) {
 const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
 if (bytes === 0) return '0 Bytes';
 const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
 return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

// Read the JSON file
const iconsFilePath = path.join(__dirname, `icons/${iconPack}/icons.json`);
const iconsFilePath_folders = path.join(__dirname, `icons/${iconPack}/icons_folders.json`);
const iconsData = fs.readFileSync(iconsFilePath);
const iconsData_folders = fs.readFileSync(iconsFilePath_folders);
const icons = JSON.parse(iconsData);
const icons_folders = JSON.parse(iconsData_folders);

function generateDirectoryListing(dirPath) {
 let parentDir = path.dirname(dirPath);
 let files = fs.readdirSync(dirPath);
 let relativePath = path.relative(__dirname, dirPath);
 let html = `<html><head><title>${title}</title><style>${extraCSS}</style><script>${extraJS}</script></head><body><h1>${title}</h1><h2>Current Directory: ${relativePath}</h2><ul>`;

 // Add a link to the parent directory at the top of the page
 html += `<li><a href="${path.relative(dirPath, parentDir)}/b-list.html"><img src="back.png" alt="Parent Directory Icon" style="width: 1em; height: 1em;">Parent Directory</a></li>`;

 files.sort((a, b) => {
 let aIsDir = fs.lstatSync(path.join(dirPath, a)).isDirectory();
 let bIsDir = fs.lstatSync(path.join(dirPath, b)).isDirectory();
 
 if (aIsDir && !bIsDir) {
   return -1;
 }

 if (!aIsDir && bIsDir) {
   return 1;
 }

 return a.localeCompare(b);
 }).forEach((file) => {
 let fullPath = path.join(dirPath, file);
 if (fs.lstatSync(fullPath).isDirectory()) {
    let fileExtension = path.extname(file).substring(1); // get file extension without the dot
    let iconName_folders = icons_folders.defaultIcon.name;
   
    icons_folders.icons.forEach((icon) => {
     if (icon.folderNames.includes(file)) {
       iconName_folders = icon.name;
     }
   });
   let iconPath = `icons/${iconPack}/img/${iconName_folders}`;
   html += `<li><img src="${iconPath}" alt="Folder Icon" style="width: 1em; height: 1em;"> <a href="${file}/b-list.html">${file}/</a></li>`;
   generateDirectoryListing(fullPath);
 } else {
   const stats = fs.statSync(fullPath);
   const fileSize = bytesToSize(stats.size);
   let fileExtension = path.extname(file).substring(1); // get file extension without the dot

   let iconName = icons.defaultIcon.name;

   icons.icons.forEach((icon) => {
     if (icon.fileNames && icon.fileNames.includes(file)) {
       iconName = icon.name;
     } else if (icon.fileExtensions && icon.fileExtensions.includes(fileExtension)) {
       iconName = icon.name;
     }
   });

   let iconPath = `icons/${iconPack}/img/${iconName}`;

   html += `<li><img src="${iconPath}" alt="${fileExtension} Icon" style="width: 1em; height: 1em;"> <a href="${file}">${file}</a> (${fileSize})</li>`;
 }
 });

 html += '</ul></body></html>';

 if (dirPath === __dirname) {
 fs.writeFileSync(path.join(dirPath, 'index.html'), html);
 } else {
 fs.writeFileSync(path.join(dirPath, 'b-list.html'), html);
 }
}

generateDirectoryListing(__dirname);
