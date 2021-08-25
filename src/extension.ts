import { ExtensionContext, QuickPickItem, window, commands, workspace } from 'vscode';

import FileHelper from './FileHelper';
import MultiStepInput from './MultiStepInput';

const COMMAND_ID = 'extension.genReactComponentFiles';

interface State {
  title: string;
  step: number;
  totalSteps: number;
  componentName: string;
  container: boolean;
  styles: boolean;
  name: string;
  runtime: QuickPickItem;
}

async function collectInputs() {
  const state = {} as Partial<State>;
  await MultiStepInput.run((input) => inputComponentName(input, state));
  return state as State;
}

const title = 'Create React Component';

const yesNo: QuickPickItem[] = ['yes', 'no'].map((label) => ({ label }));

const totalSteps = 3;

const shouldResume = () => {
  return new Promise<boolean>((resolve, reject) => {});
};

// Step 1
async function inputComponentName(input: MultiStepInput, state: Partial<State>) {
  state.componentName = await input.showInputBox({
    title,
    step: 1,
    totalSteps,
    prompt: 'Choose a name for the component',
    value: state.componentName || '',
    validate: (v: string) => Promise.resolve(v.length <= 0 ? 'Name must be defined' : undefined),
    shouldResume,
  });
  return (i: MultiStepInput) => pickContainer(i, state);
}

// Step 2
async function pickContainer(input: MultiStepInput, state: Partial<State>) {
  const pick = await input.showQuickPick({
    title,
    step: 2,
    totalSteps,
    placeholder: 'Do you need a container?',
    items: yesNo,
    activeItem: yesNo[0],
    shouldResume,
  });
  state.container = pick.label === 'yes';
  return (i: MultiStepInput) => pickStyles(i, state);
}

// Step 3
async function pickStyles(input: MultiStepInput, state: Partial<State>) {
  const pick = await input.showQuickPick({
    title,
    step: 3,
    totalSteps,
    placeholder: 'Do you need a styles file?',
    items: yesNo,
    activeItem: yesNo[0],
    shouldResume,
  });
  state.styles = pick.label === 'yes';
}

const createComponent = async (uri: string) => {
  const { componentName, container, styles } = await collectInputs();

  const componentDir = FileHelper.createComponentDir(uri, componentName);

  const indexFilePath = FileHelper.createIndexFile(uri, componentDir, componentName, container);
  const componentFilePath = FileHelper.createComponentFile(
    uri,
    componentDir,
    componentName,
    styles,
  );
  const containerFilePath = container
    ? FileHelper.createContainerFile(uri, componentDir, componentName)
    : null;
  const stylesFilePath = styles
    ? FileHelper.createStylesFile(uri, componentDir, componentName)
    : null;

  const filePaths = [indexFilePath, componentFilePath, containerFilePath, stylesFilePath].filter(
    (path): path is string => path !== null,
  );

  // const documents = await Promise.all(filePaths.map((path) => workspace.openTextDocument(path)));
  // await Promise.all(
  //   documents.map((textDocument) => window.showTextDocument(textDocument, undefined, true)),
  // );

  window.showInformationMessage(`Creating component '${componentName}'`);
};

export function activate(context: ExtensionContext) {
  const disposable = commands.registerCommand(COMMAND_ID, createComponent);
  context.subscriptions.push(disposable);
}
