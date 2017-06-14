import * as commander from 'commander';
import * as inquirer from 'inquirer';

import { getAllInstalledAtomVersions, getInstalledAtomVersionKind,
  getVersionFromInstalledAtom, versionKindToString, AtomVersionKind,
  stringToVersionKind, uninstallCurrentAtom, cleanInstallAtomVersion, switchToInstalledAtom
} from './api';

let hasRunCommand = false;

export async function switchVersion(channel: string) {
  hasRunCommand = true;
  let kind;
  try {
    kind = stringToVersionKind(channel);
  } catch (e) {
    console.error(`\nUnrecognized channel name ${channel} - valid names are 'stable', 'beta'`);
    process.exit(-1);
  }

  let currentAtom = getInstalledAtomVersionKind();
  if (currentAtom === AtomVersionKind.Unknown) {
    console.log('\n*** Currently installed Atom is unknown or not managed by atom-version-manager ***');

    let shouldUninstall = await inquirer.prompt([{
      type: 'confirm',
      name: 'uninstall',
      message: 'Uninstall it?',
      default: false
    }]);

    if (!shouldUninstall.uninstall) {
      console.log('Not uninstalling. Exiting.');
      process.exit(-1);
    }

    console.log('Uninstalling...');
    await uninstallCurrentAtom(undefined, true);
  }

  let atomVersions = getAllInstalledAtomVersions();
  if (!atomVersions.has(kind!)) {
    console.log('Channel not currently installed - installing...');
    await cleanInstallAtomVersion(kind!);
  } else {
    console.log(`Switching channels: ${channel}`);
    await switchToInstalledAtom(kind!);
  }
}

export function displayVersion() {
  hasRunCommand = true;

  let versions = getAllInstalledAtomVersions();
  let current = getInstalledAtomVersionKind();

  console.log('\nInstalled Atom Versions:\n');

  versions.forEach((dir, ver) => {
    let currentSym = (ver === current) ? '*' : ' ';
    let version = getVersionFromInstalledAtom(dir);
    let name = versionKindToString(ver);

    console.log(`${currentSym} ${name} - ${version}`);
  });

  if (current === AtomVersionKind.Unknown || AtomVersionKind.NotInstalled) {
    console.log('\n*** Currently installed Atom is unknown or not managed by atom-version-manager');
  }
}

export function removeVersion(channel: string) {
  hasRunCommand = true;
  console.log(`Remove! ${channel}`);
}

// tslint:disable-next-line:no-var-requires
commander.version(require('../package.json').version);

commander
  .command('switch [channel]').alias('s')
  .description('Switch between installed versions of Atom')
  .action(switchVersion);

commander
  .command('info').alias('i')
  .description('List the installed channels and your current channel')
  .action(displayVersion);

commander
  .command('remove [channel]').alias('r')
  .description('Remove an installed channel to save disk space')
  .action(removeVersion);

commander.parse(process.argv);

if (!hasRunCommand) {
  displayVersion();
  process.exit(0);
}