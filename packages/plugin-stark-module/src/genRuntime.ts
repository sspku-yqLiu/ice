import * as path from 'path';
import { compileTemplate } from './hbs.helpler';
import { PartialPlugin, Externals, Runtime, Options, Depth } from './types';
import { getModules } from './entry.helper';

const any2ArrayAny= <T>(any: T) => Array.isArray(any) ? any : [any];

const getVersionByUrl = (url: string | string[]): string | undefined => {
  const sevReg = /(([0-9]|([1-9]([0-9]*))).){2}([0-9]|([1-9]([0-9]*)))([-](([0-9A-Za-z]|([1-9A-Za-z]([0-9A-Za-z]*)))[.]){0,}([0-9A-Za-z]|([1-9A-Za-z]([0-9A-Za-z]*)))){0,1}([+](([0-9A-Za-z]{1,})[.]){0,}([0-9A-Za-z]{1,})){0,1}/;

  const matches = any2ArrayAny(url)[0].match(sevReg);
  return matches && matches[0];
};

const formatVersion = (version: string, depth: Depth = 0): string => {
  const map = new Map([
    ['major', 0],
    ['minor', 1],
    ['patch', 2]
  ]);
  const localDepth = (depth !== 0 && depth !== 1 && depth !== 2) ? map.get(depth) : depth;
  return version.split('.').slice(0, localDepth + 1).join('.');
};

const getMark = (runtime: Runtime) => {
  const { root, version, depth, url } = runtime;
  const localVersion = version ? String(version) : getVersionByUrl(url);
  return `${root}@${formatVersion(localVersion, depth)}`;
};

const genRuntimesConfig = (externals: Externals) => {
  return Object.keys(externals)
    .filter(key => typeof externals[key] !== 'string')
    .map(key => ({
      ...(externals[key] as Runtime),
      id: getMark(externals[key] as Runtime),
    }));
};

const genRuntime = ({ context }: PartialPlugin, { externals, modules, outputDir }: Options) => {
  const { rootDir } = context;

  const entries = getModules(modules);
  Object
    .keys(entries)
    .forEach(key => {
      const outputPath = path.join(rootDir, `${outputDir ?? 'dist'}/${key}`, 'runtime.json');
      compileTemplate({
        template: 'runtime.hbs',
        outputPath,
        params: {
          runtimes: genRuntimesConfig(externals),
        }
      });
    });
};

export default genRuntime;