import { workspace, Uri, window } from 'vscode';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as Mustache from 'mustache';

interface StyleInterface {
  suffix?: string,
  type?: string
}

interface ContainerInterface {
  suffix?: string,
}

const getConfig = (uri?: Uri)  => {
  return workspace.getConfiguration('CreateReactComponent', uri) as any;
}

const getStyleConfig = (uri?: Uri): StyleInterface => {
  return getConfig(uri).get('styleFile');
}

const getContainerConfig = (uri?: Uri): ContainerInterface => {
  return getConfig(uri).get('containerFile');
}

export default class FileHelper {
  private static createFile = (destinationPath: string, templateFileName: string, config: Object) => {
    console.log(destinationPath, templateFileName, config)
    const templatePath = path.join(__dirname, 'templates', templateFileName);
    console.log(templatePath)
    const templateContent = fs.readFileSync(templatePath).toString();
    const renderedFile = Mustache.render(templateContent, config);
    fs.writeFileSync(destinationPath, renderedFile);
  };

  public static createComponentDir(uri: any, componentName: string): string {
    let contextMenuSourcePath;

    if (uri && fs.lstatSync(uri.fsPath).isDirectory()) {
      contextMenuSourcePath = uri.fsPath;
    } else if (uri) {
      contextMenuSourcePath = path.dirname(uri.fsPath);
    } else {
      contextMenuSourcePath = workspace.rootPath;
    }

    const componentDir = `${contextMenuSourcePath}/${componentName}`;
    fse.mkdirsSync(componentDir);

    return componentDir;
  };

  public static createIndexFile(uri: any, componentDir: string, componentName: string, container: boolean): string {
    const containerConfig = getContainerConfig(uri);

    const exportFileName = container ? `${componentName}${containerConfig.suffix}` : componentName;
    const destinationPath = path.join(componentDir, 'index.js');

    this.createFile(destinationPath, 'index.mst', { exportFileName });

    return destinationPath;
  };

  public static createComponentFile(uri: any, componentDir: string, componentName: string, styles: boolean): string {
    const styleConfig = getStyleConfig(uri);

    const styleFileExtension = (() => {
      switch (styleConfig.type) {
        case 'styled-components (.js)':
          return '.js';
        case 'standard (.css)':
          return '.css';
        default:
          return '';
      }
    })();

    const styleFileName = `${componentName}${styleConfig.suffix}${styleFileExtension}`;
    const destinationPath = path.join(componentDir, `${componentName}.js`);

    this.createFile(destinationPath, 'component.mst', { styleFileName, isStyledComponent: styleConfig.type === 'styled-components (.js)' });

    return destinationPath;
  };

  public static createContainerFile(uri: any, componentDir: string, componentName: string): string {
    const containerConfig = getContainerConfig(uri);
    const destinationPath = path.join(componentDir, `${componentName}${containerConfig.suffix}.js`);
    this.createFile(destinationPath, 'container.mst', { componentName });
    return destinationPath;
  };

  public static createStylesFile(uri: any, componentDir: string, componentName: string): string {
    const styleConfig = getStyleConfig(uri);

    const styleFileExtension = (() => {
      switch (styleConfig.type) {
        case 'styled-components (.js)':
          return '.js';
        case 'standard (.css)':
          return '.css';
        default:
          return '';
      }
    })();

    const styleFileName = `${componentName}${styleConfig.suffix}${styleFileExtension}`;
    const destinationPath = path.join(componentDir, styleFileName);

    this.createFile(destinationPath, 'styles.mst', { componentName, isStyledComponent: styleConfig.type === 'styled-components (.js)' });

    return destinationPath;
  };
}