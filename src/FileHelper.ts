import { workspace, Uri } from 'vscode';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as Mustache from 'mustache';

interface StyleInterface {
  suffix?: string,
  type?: string
};

interface ContainerInterface {
  suffix?: string,
};

interface TypesInterface {
  suffix?: string,
};

const getConfig = (uri?: Uri)  => {
  return workspace.getConfiguration('CreateReactComponent', uri) as any;
};

const getStyleConfig = (uri?: Uri): StyleInterface => {
  return getConfig(uri).get('styleFile');
};

const getContainerConfig = (uri?: Uri): ContainerInterface => {
  return getConfig(uri).get('containerFile');
};

const getTypesConfig = (uri?: Uri): TypesInterface => {
  return getConfig(uri).get('typesFile');
};

export default class FileHelper {
  private static createFile = (destinationPath: string, templateFileName: string, config: Object) => {
    const templatePath = path.join(__dirname, 'templates', templateFileName);
    const templateContent = fs.readFileSync(templatePath).toString();
    const renderedFile = Mustache.render(templateContent, config);
    fs.writeFileSync(destinationPath, renderedFile);
  };

  private static addExtension = (fileName: string, extenstion: string): string => {
    if (fileName.endsWith(extenstion)) {
      return fileName;
    }
    return `${fileName}${extenstion}`;
  };

  private static getTypesFileName = (uri: any, componentName: string): string => {
    const typesConfig = getTypesConfig(uri);
    return `${componentName}${typesConfig.suffix}`;
  };

  private static getContainerFileName = (uri: any, componentName: string): string => {
    const containerConfig = getContainerConfig(uri);
    return `${componentName}${containerConfig.suffix}`;
  };

  private static getComponentFileName = (uri: any, componentName: string): string => {
    const containerConfig = getContainerConfig(uri);
    return `${componentName}${containerConfig.suffix}`;
  };

  private static getStylesFileName = (uri: any, componentName: string): string => {
    const styleConfig = getStyleConfig(uri);
    return `${componentName}${styleConfig.suffix}`;
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
    const containerFileName = this.getContainerFileName(uri, componentName);
    const exportFileName = container ? containerFileName : componentName;
    const destinationPath = path.join(componentDir, 'index.js');
    
    this.createFile(destinationPath, 'index.mst', { exportFileName });

    return destinationPath;
  };

  public static createComponentFile(uri: any, componentDir: string, componentName: string, hasStyles: boolean): string {
    const styleConfig = getStyleConfig(uri);

    const destinationPath = path.join(componentDir, this.addExtension(componentName, '.js'));
    
    const typesFileName = this.getTypesFileName(uri, componentName);
    const styleFileName = this.getStylesFileName(uri, componentName);

    const isStyledComponent =  styleConfig.type === 'styled-components (.js)';

    this.createFile(destinationPath, 'component.mst', { componentName, styleFileName, typesFileName, hasStyles, isStyledComponent });

    return destinationPath;
  };

  public static createContainerFile(uri: any, componentDir: string, componentName: string): string {
    const typesFileName = this.getTypesFileName(uri, componentName);
    const containerFileName = this.getContainerFileName(uri, componentName);
    const destinationPath = path.join(componentDir, this.addExtension(containerFileName, '.js'));
    this.createFile(destinationPath, 'container.mst', { componentName, typesFileName });
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

    const isStyledComponent = styleConfig.type === 'styled-components (.js)';
    const typesFileName = this.getTypesFileName(uri, componentName);
    const stylesFileName = this.getStylesFileName(uri, componentName);
    const destinationPath = path.join(componentDir, this.addExtension(stylesFileName, styleFileExtension));
    
    this.createFile(destinationPath, 'styles.mst', { componentName, typesFileName, isStyledComponent });

    return destinationPath;
  };

  public static createTypesFile(uri: any, componentDir: string, componentName: string, styles: boolean, container: boolean): string {
    const styleConfig = getStyleConfig(uri);
    const isStyledComponent = styleConfig.type === 'styled-components (.js)' && styles;

    const typesFileName = this.getTypesFileName(uri, componentName);
    const destinationPath = path.join(componentDir, this.addExtension(typesFileName, '.js'));
    this.createFile(destinationPath, 'types.mst', { isStyledComponent, hasContainer: container });
    return destinationPath;
  };
}