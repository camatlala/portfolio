const fs = require('fs');
const opentype = require('opentype.js');

const inputPath = process.argv[2];
const outputPath = process.argv[3];

const buffer = fs.readFileSync(inputPath);
const font = opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));

const scale = (1000 * 100) / ((font.unitsPerEm || 2048) * 72);
const result = { glyphs: {} };

for (let i = 0; i < font.glyphs.length; i++) {
  const glyph = font.glyphs.get(i);

  const unicodes = [];
  if (glyph.unicode !== undefined) unicodes.push(glyph.unicode);
  if (glyph.unicodes && glyph.unicodes.length) {
    glyph.unicodes.forEach((u) => {
      if (unicodes.indexOf(u) === -1) unicodes.push(u);
    });
  }

  unicodes.forEach((unicode) => {
    const token = {
      ha: Math.round(glyph.advanceWidth * scale),
      x_min: Math.round(glyph.xMin * scale),
      x_max: Math.round(glyph.xMax * scale),
      o: '',
    };

    glyph.path.commands.forEach((command) => {
      let type = command.type.toLowerCase();
      if (type === 'c') type = 'b';
      token.o += type + ' ';
      if (command.x !== undefined && command.y !== undefined) {
        token.o += Math.round(command.x * scale) + ' ' + Math.round(command.y * scale) + ' ';
      }
      if (command.x1 !== undefined && command.y1 !== undefined) {
        token.o += Math.round(command.x1 * scale) + ' ' + Math.round(command.y1 * scale) + ' ';
      }
      if (command.x2 !== undefined && command.y2 !== undefined) {
        token.o += Math.round(command.x2 * scale) + ' ' + Math.round(command.y2 * scale) + ' ';
      }
    });
    token.o = token.o.trim();

    result.glyphs[String.fromCodePoint(unicode)] = token;
  });
}

const windowsNames = (font.names && font.names.windows) || {};
result.familyName =
  (windowsNames.preferredFamily && windowsNames.preferredFamily.en) ||
  (windowsNames.fontFamily && windowsNames.fontFamily.en) ||
  'CustomFont';

result.ascender = Math.round(font.ascender * scale);
result.descender = Math.round(font.descender * scale);
result.underlinePosition = Math.round(font.tables.post.underlinePosition * scale);
result.underlineThickness = Math.round(font.tables.post.underlineThickness * scale);
result.boundingBox = {
  yMin: Math.round(font.tables.head.yMin * scale),
  xMin: Math.round(font.tables.head.xMin * scale),
  yMax: Math.round(font.tables.head.yMax * scale),
  xMax: Math.round(font.tables.head.xMax * scale),
};
result.resolution = 1000;
result.original_font_information = font.tables.name;

const styleName =
  (windowsNames.preferredSubfamily && windowsNames.preferredSubfamily.en) ||
  (windowsNames.fontSubfamily && windowsNames.fontSubfamily.en) ||
  '';
result.cssFontWeight = styleName.toLowerCase().includes('bold') ? 'bold' : 'normal';
result.cssFontStyle = styleName.toLowerCase().includes('italic') ? 'italic' : 'normal';

fs.writeFileSync(outputPath, JSON.stringify(result));
console.log(`Wrote ${Object.keys(result.glyphs).length} glyphs to ${outputPath}`);
