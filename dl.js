import fs from "fs";
import path from "path";
import pretty from "pretty";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configData = fs.readFileSync("config.json");
const config = JSON.parse(configData);
let debCount = 0;

// Load config
const iconPack = config.iconPack || "material";
const title = config.title || "Boofdev's apt repo";
const extraCSS = fs.readFileSync(path.join(process.cwd(), config.extraCSS));
const extraJS = fs.readFileSync(path.join(process.cwd(), config.extraJS));
const blocklist = config.blocklist ? config.blocklist.map(regex => new RegExp(regex)) : [];
const showHashes = config.showHashes || false;

function generateSHA256Hash(file) {
  const fileBuffer = fs.readFileSync(file);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);

  return hashSum.digest('hex');
}

function bytesToSize(bytes) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Bytes";
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + " " + sizes[i];
}

function countDebFiles(dir) {
  let count = 0;
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      count += countDebFiles(fullPath);
    } else if (path.extname(file) === '.deb') {
      count++;
    }
  });

  return count;
}

// Read the JSON file
const iconsFilePath = path.join(process.cwd(), `icons/${iconPack}/icons.json`);
const iconsFilePath_folders = path.join(
  process.cwd(),
  `icons/${iconPack}/icons_folders.json`
);
const iconsData = fs.readFileSync(iconsFilePath);
const iconsData_folders = fs.readFileSync(iconsFilePath_folders);
const icons = JSON.parse(iconsData);
const icons_folders = JSON.parse(iconsData_folders);

if (config.showPackageNum) {
      debCount = countDebFiles(process.cwd());
}

function generateDirectoryListing(dirPath) {
  const currentDir = path.basename(dirPath);
  let parentDir = path.dirname(dirPath);
  let files = fs.readdirSync(dirPath);
  let relativePath = path.relative(process.cwd(), dirPath);

  // Check if the current directory is in the blocklist
  if (blocklist.some((regex) => regex.test(path.relative(process.cwd(), dirPath)))) {
    // If it is, return immediately without generating the directory listing
    return;
  }
  let html = `<!DOCTYPE html><!-- Created by Boofdev - boofdev.eu --><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title><style>${extraCSS}</style><script>${extraJS}</script></head><body><h1>${title}</h1>`;
  if (config.showPackageNum) {
    html += `<h3>Serving ${debCount} packages</h3>`;
  }
  html += `<h2>Current Directory: ${relativePath}</h2><ul>`;

  // Add a link to the parent directory at the top of the page
  html += `<li><a href="${path.relative(
    dirPath,
    parentDir
  )}/b-list.html"><img src="/icons/back.svg" alt="Parent Directory Icon" style="width: 1em; height: 1em;">Parent Directory</a></li>`;

  files
    .sort((a, b) => {
      let aIsDir = fs.lstatSync(path.join(dirPath, a)).isDirectory();
      let bIsDir = fs.lstatSync(path.join(dirPath, b)).isDirectory();

      if (aIsDir && !bIsDir) {
        return -1;
      }

      if (!aIsDir && bIsDir) {
        return 1;
      }

      return a.localeCompare(b);
    })
    .forEach((file) => {
      let fullPath = path.join(dirPath, file);
      if (fs.lstatSync(fullPath).isDirectory()) {
        let fileExtension = path.extname(file).substring(1); // get file extension without the dot
        let iconName_folders = icons_folders.defaultIcon.name;

        icons_folders.icons.forEach((icon) => {
          if (icon.folderNames.includes(file)) {
            iconName_folders = icon.name;
          }
        });
        let iconPath = `/icons/${iconPack}/img/${iconName_folders}`;
        html += `<a href="${file}/b-list.html"><li><img src="${iconPath}" alt="Folder Icon" style="width: 1em; height: 1em;"> ${file}/</li></a>`;
        generateDirectoryListing(fullPath);
      } else {
        const stats = fs.statSync(fullPath);
        const fileSize = bytesToSize(stats.size);
        let fileExtension = path.extname(file).substring(1); // get file extension without the dot

        let iconName = icons.defaultIcon.name;

        icons.icons.forEach((icon) => {
          if (icon.fileNames && icon.fileNames.includes(file)) {
            iconName = icon.name;
          } else if (
            icon.fileExtensions &&
            icon.fileExtensions.includes(fileExtension)
          ) {
            iconName = icon.name;
          }
        });

        let iconPath = `/icons/${iconPack}/img/${iconName}`;
        if (showHashes) {
          const fileHash = generateSHA256Hash(fullPath);
          html += `<a href="${file}"><li><img src="${iconPath}" alt="${fileExtension} Icon" style="width: 1em; height: 1em;"> ${file} (${fileSize}, SHA256: ${fileHash})</li></a>`;
        } else {
          html += `<a href="${file}"><li><img src="${iconPath}" alt="${fileExtension} Icon" style="width: 1em; height: 1em;"> ${file} (${fileSize})</li></a>`;
        }
        }
    });

  html += "</ul></body></html><!-- Created by Boofdev - boofdev.eu -->";
    fs.writeFileSync(path.join(dirPath, "b-list.html"), pretty(html));
}

generateDirectoryListing(process.cwd());
