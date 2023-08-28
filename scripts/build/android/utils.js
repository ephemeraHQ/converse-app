const fs = require("fs");
const path = require("path");

const findFilesRecursively = (
  folderPath,
  fileExtensions = [".kt", ".java"]
) => {
  const files = [];

  function scanDirectory(directory) {
    fs.readdirSync(directory).forEach((file) => {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        scanDirectory(filePath);
      } else if (stats.isFile()) {
        const fileExtension = path.extname(filePath);

        if (fileExtensions.includes(fileExtension)) {
          files.push(filePath);
        }
      }
    });
  }

  scanDirectory(folderPath);

  return files;
};

module.exports = {
  findFilesRecursively,
};
