import * as path from 'path';
import * as mkdirp from 'mkdirp';
import * as semver from 'semver';
import * as zlib from 'zlib';
import * as tar from 'tar';
import * as fse from 'fs-extra';
import urlJoin from 'url-join';
import axios, { type AxiosResponse } from 'axios';
import { AH_NPM_REGISTRY, AH_APP_NPM_REGISTRY } from './constant';

/**
 * 获取指定 npm 包版本的 tarball 地址
 *
 * @param {string} npm
 * @param {?string} [version]
 * @param {?string} [registry]
 */
function getNpmTarball(npm: string, version?: string, registry?: string): Promise<string> {
  return getNpmInfo(npm, registry).then((info: any) => {
    if (!semver.valid(version)) {
      // support beta or other tag
      version = info['dist-tags'][version] || info['dist-tags'].latest;
    }
    if (semver.valid(version) && info.versions && info.versions[version] && info.versions[version].dist) {
      return info.versions[version].dist.tarball;
    }
    return Promise.reject(new Error(`没有在 ${registry} 源上找到 ${npm}@${version} 包`));
  })
}

/**
 *  获取安装包信息
 *
 * @param {string} npm
 * @param {?string} [registry]
 * @returns {Promise<any>}
 */
function getNpmInfo(npm: string, registry?: string): Promise<any> {
  const register = registry || getNpmRegistry(npm);
  const url = urlJoin(register, npm);
  return axios({ url }).then((res) => res.data);
}

/**
 * 获取指定 npm 包版本的 registry 地址
 *
 * @param {string} [npmName='']
 * @returns {string}
 */
function getNpmRegistry(npmName = ''): string {
  if (process.env.REGISTRY) {
    return process.env.REGISTRY;
  }
  if (isAhNpm(npmName)) {
    return npmName.includes('@bdpweb') ? AH_APP_NPM_REGISTRY : AH_NPM_REGISTRY;
  }
  return 'https://registry.npmmirror.com';
}

/**
 * 判断包名开头是否带有 `@bdpweb|@auto`
 *
 * @param {string} npmName
 * @returns {boolean}
 */
function isAhNpm(npmName: string): boolean {
  return /^(@auto|@bdpweb)\//.test(npmName);
}

/**
 * 获取指定 tar 并解压到指定目录
 *
 * @param {string} destDir
 * @param {string} tarball
 * @param {?(progress: number) => void} [progressFn]
 * @param {?(filename: string) => string} [formatFilename]
 * @returns {void, formatFilename?: (filename: string) => string) => void}
 */
function getAndExtractTarball(
  destDir: string,
  tarball: string,
  progressFn = (state) => { console.log(state) },
  formatFilename = (filename: string): string => {
    return filename.replace(/^_/, '').replace(/^\w/, '.')
  }): Promise<string[]> {

  return new Promise((resolve, reject) => {
    const allFiles = [];
    const allWriteStream = [];
    const dirCollector = [];

    axios({
      url: tarball,
      responseType: 'stream',
      timeout: 10000,
      onDownloadProgress: (progressEvent) => {
        progressFn(progressEvent);
      }
    }).then(response => {
      const totalLen = Number(response.headers['content-length']);
      let downloadLen = 0;
      response.data
        .on('data', chunk => {
          downloadLen += chunk.length;
          progressFn({
            percent: (downloadLen - 50) / totalLen,
          })
        })
        .pipe(zlib.createUnzip())
        .pipe(new tar.Parser())
        .on('entry', (entry) => {
          if (entry.type === 'Directory') {
            entry.resume();
            return;
          }
          const realPath = entry.path.replace(/^package\//, '');
          let filename = path.basename(realPath);
          filename = formatFilename(filename);
          const destPath = path.join(destDir, path.dirname(realPath), filename);

          const dirToBeCreate = path.dirname(destPath);
          if (!dirCollector.includes(dirToBeCreate)) {
            dirCollector.push(dirToBeCreate);
            mkdirp.sync(dirToBeCreate);
          }
          allFiles.push(destPath);
          allWriteStream.push(
            new Promise(streamResolve => {
              entry.pipe(fse.createWriteStream(destPath, {
                mode: entry.mode
              }))
                .on('finish', () => streamResolve(true))
                .on('close', () => streamResolve(true));// resolve when file is empty in node v8
            }),
          )
        })
        .on('end', () => {
          if (progressFn) {
            progressFn({
              percent: 1,
            })
          }
          Promise.all(allWriteStream)
            .then(() => resolve(allFiles))
            .catch(reject);
        })
    });
  })
}


/**
 * 获取指定包信息
 *
 * @param {string} npm
 * @param {?string} [register]
 * @returns {Promise<string[]>}
 */
function getVersions(npm: string, register?: string): Promise<string[]> {
  return getNpmInfo(npm, register).then((info: any) => {
    const versions = Object.keys(info.versions);
    return versions;
  })
}

/**
 *  根据指定范围（比如：1.x，< 5.x），获取符合的所有版本号
 *
 * @param {string} npm 指定包名
 * @param {string} range 指定范围
 * @param {?string} [registry] 指定注册源
 * @returns {*}
 */
function getSatisfiesVersions(npm: string, range: string, registry?: string) {
  return getVersions(npm, registry).then((versions) => {
    return versions
      .filter((version) => semver.satisfies(version, range))
      .sort((a, b) => {
        return semver.gt(b, a);
      });
  });
}

/**
 * 根据指定 versions 获取符合 semver 规范的最新版本号
 *
 * @param {string} baseVersion
 * @param {string[]} versions 
 * @returns {string}
 */
function getLatestSemverVersion(baseVersion: string, versions: string[]): string {
  versions = versions
    .filter((version) => semver.satisfies(version, `^${baseVersion}`))
    .sort((a, b) => {
      return semver.gt(b, a) ? 1 : -1;
    });
  return versions[0];
}


/**
 * 根据指定 versions 获取符合 semver 规范的最新版本号
 *
 * @param {string} npm
 * @param {string} baseVersion
 * @param {?string} [registry]
 * @returns {Promise<string>}
 */
function getNpmLatestSemverVersion(npm: string, baseVersion: string, registry?: string): Promise<string> {
  return getVersions(npm, registry).then((versions) => {
    return getLatestSemverVersion(baseVersion, versions);
  });
}


/**
 * 获取指定npm包最新版本号
 *
 * @param {*} npm
 * @param {?string} [registry]
 * @returns {Promise<string>}
 */
function getLatestVersion(npm, registry?: string): Promise<string> {
  return getNpmInfo(npm, registry).then((data) => {
    if (!data['dist-tags'] || !data['dist-tags'].latest) {
      console.error('没有 latest 版本号', data);
      return Promise.reject(new Error('Error: 没有 latest 版本号'));
    }

    const latestVersion = data['dist-tags'].latest;
    return latestVersion;
  });
}


/**
 * 获取 unpkg 的地址,可以用个该地址直接使用
 *
 * @param {string} [npmName=''] 指定包名
 * @returns {string}
 */
function getUnpkgHost(npmName = ''): string {
  if (process.env.UNPKG) {
    return process.env.UNPKG;
  }
  if (isAhNpm(npmName)) {
    return 'https://g.autoimg.cn/@app/static';
  }

  return 'https://unpkg.com';
}

/**
 *  获取 npm Client
 *
 * @param {string} [npmName='']
 * @returns {string}
 */
function getNpmClient(npmName = ''): string {
  if (process.env.NPM_CLIENT) {
    return process.env.NPM_CLIENT;
  }
  if (isAhNpm(npmName)) {
    return 'npm'; // 内部环境使用可能使用特定的
  }
  return 'npm';
}


/**
 *  读取 package.json 文件
 *
 * @async
 * @param {string} projectPath
 * @returns {unknown}
 */
async function readPackageJSON(projectPath: string) {
  const packagePath = path.join(projectPath, 'package.json');
  const packagePathIsExist = await fse.pathExists(packagePath);
  if (!packagePathIsExist) {
    throw new Error("Project's package.json file not found in local environment");
  }
  const content = await fse.readJson(packagePath);
  return content;
}


/**
 * 获取已安装在本地的模块版本号
 *
 * @param {string} projectPath
 * @param {string} packageName
 * @returns {string}
 */
function getPackageLocalVersion(projectPath: string, packageName: string): string {
  const packageJsonPath = path.join(projectPath, 'node_modules', packageName, 'package.json');
  const packageJson = JSON.parse(fse.readFileSync(packageJsonPath, 'utf-8'));
  return packageJson.version;
}


/**
 * 检查是否为之家内部环境
 *
 * @returns {Promise<boolean>}
 */
function checkAhInternal(): Promise<boolean> {
  return axios({
    url: 'http://r.npm.corpautohome.com/',
    timeout: 3 * 1000,
  })
    .then((response: AxiosResponse<any>) => {
      const { data } = response;
      return data && data.db_name === 'registry';
    })
    .catch(() => {
      return false;
    });
}

export {
  getNpmTarball,
  getNpmInfo,
  getLatestVersion,
  getNpmLatestSemverVersion,
  getNpmRegistry,
  getUnpkgHost,
  getNpmClient,
  getVersions,
  getSatisfiesVersions,
  isAhNpm,
  checkAhInternal,
  getAndExtractTarball,
  readPackageJSON,
  getPackageLocalVersion,
};
