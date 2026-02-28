const path = require('path');
const { rcedit } = require('rcedit');

exports.default = async function (context) {
  const exePath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.exe`);
  const iconPath = path.join(context.appOutDir, '..', '..', 'assets', 'icon.ico');
  await rcedit(exePath, { icon: iconPath });
  console.log(`  • stamped icon onto ${path.basename(exePath)}`);
};
