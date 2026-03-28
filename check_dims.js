const fs = require('fs');
const sizeOf = require('image-size');

try {
  const dimensions = sizeOf('c:/AI Agent Folder/Captain Beeble 26/assets/bug_sprite_sheet.PNG');
  console.log(dimensions.width, dimensions.height);
} catch (err) {
  console.error(err);
}
