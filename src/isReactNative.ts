import * as fs from 'fs';
import * as path from 'path';

export const isReactNative = (startAt: string): boolean => {
  let root = startAt;
  while (!fs.existsSync(path.join(root, 'package.json'))) {
    root = root.split(path.sep).slice(0, -1).join(path.sep);
  }

  const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

  return Boolean(packageJson.dependencies['react-native']);
};
