import * as fs from 'fs';
import * as path from 'path';

import { workspace, window, Uri } from 'vscode';
import * as fse from 'fs-extra';
import * as Mustache from 'mustache';

interface StyleInterface {
  suffix?: string;
  type: 'Styled components' | 'CSS';
}

interface ContainerInterface {
  suffix?: string;
}

interface ComponentInterface {
  suffix?: string;
}

type Language = 'TypeScript' | 'JavaScript';

const getConfig = (uri?: Uri) => {
  return workspace.getConfiguration('CreateReactComponent', uri) as any;
};

const getStyleConfig = (uri?: Uri): StyleInterface => {
  return getConfig(uri).get('styleFile');
};

const getContainerConfig = (uri?: Uri): ContainerInterface => {
  return getConfig(uri).get('containerFile');
};

const getComponentConfig = (uri?: Uri): ComponentInterface => {
  return getConfig(uri).get('componentFile');
};

const getLanguageConfig = (uri?: Uri): Language => {
  return getConfig(uri).get('language');
};

const getJsExtension = (uri: Uri, jsx: boolean): '.js' | '.jsx' | '.ts' | '.tsx' => {
  const language = getLanguageConfig(uri);
  if (language === 'TypeScript') {
    return jsx ? '.tsx' : '.ts';
  }
  if (language === 'JavaScript') {
    return jsx ? '.jsx' : '.ts';
  }
  throw new Error();
};

export default class FileHelper {
  private static createFile = (
    destinationPath: string,
    templateFileName: string,
    config: Record<string, any>,
  ) => {
    const templatePath = path.join(__dirname, 'templates', templateFileName);
    const templateContent = fs.readFileSync(templatePath).toString();
    const renderedFile = Mustache.render(templateContent, config);
    fs.writeFileSync(destinationPath, renderedFile);
  };

  private static buildFileName = (
    name: string,
    suffix: string,
    extension: string,
    inclExt: boolean,
  ): string => {
    return `${name}${(suffix.length ?? 0) > 0 ? '.' : ''}${suffix}${inclExt ? extension : ''}`;
  };

  private static getContainerFileName = (
    uri: any,
    componentName: string,
    inclExt: boolean,
  ): string => {
    const extenstion = getJsExtension(uri, true);
    const containerConfig = getContainerConfig(uri);
    return FileHelper.buildFileName(
      componentName,
      containerConfig.suffix ?? '',
      extenstion,
      inclExt,
    );
  };

  private static getComponentFileName = (
    uri: any,
    componentName: string,
    inclExt: boolean,
  ): string => {
    const extenstion = getJsExtension(uri, true);
    const componentConfig = getComponentConfig(uri);
    return FileHelper.buildFileName(
      componentName,
      componentConfig.suffix ?? '',
      extenstion,
      inclExt,
    );
  };

  private static getStylesFileName = (
    uri: any,
    componentName: string,
    inclExt: boolean,
  ): string => {
    const styleConfig = getStyleConfig(uri);
    const extenstion =
      styleConfig.type === 'Styled components' ? getJsExtension(uri, true) : '.css';
    return FileHelper.buildFileName(componentName, styleConfig.suffix ?? '', extenstion, inclExt);
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
  }

  public static createIndexFile(
    uri: any,
    componentDir: string,
    componentName: string,
    container: boolean,
  ): string {
    const containerFileName = this.getContainerFileName(uri, componentName, false);
    const componentFileName = this.getComponentFileName(uri, componentName, false);
    const indexFileName = this.buildFileName('index', '', getJsExtension(uri, false), true);
    const destinationPath = path.join(componentDir, indexFileName);

    this.createFile(destinationPath, 'index.mst', {
      hasContainer: container,
      containerFileName,
      componentFileName,
      componentName,
    });

    return destinationPath;
  }

  public static createComponentFile(
    uri: any,
    componentDir: string,
    componentName: string,
    hasStyles: boolean,
  ): string {
    const destinationPath = path.join(
      componentDir,
      FileHelper.getComponentFileName(uri, componentName, true),
    );

    const styleFileName = this.getStylesFileName(uri, componentName, false);

    this.createFile(destinationPath, 'component.mst', { componentName, styleFileName, hasStyles });

    return destinationPath;
  }

  public static createContainerFile(uri: any, componentDir: string, componentName: string): string {
    const containerFileName = this.getContainerFileName(uri, componentName, true);
    const destinationPath = path.join(componentDir, containerFileName);
    this.createFile(destinationPath, 'container.mst', { componentName });
    return destinationPath;
  }

  public static createStylesFile(uri: any, componentDir: string, componentName: string): string {
    const stylesFileName = this.getStylesFileName(uri, componentName, true);
    const destinationPath = path.join(componentDir, stylesFileName);

    this.createFile(destinationPath, 'styles.mst', { componentName });

    return destinationPath;
  }
}
