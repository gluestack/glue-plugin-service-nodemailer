//@ts-ignore
import packageJSON from "../package.json";
import { PluginInstance } from "./PluginInstance";
import IApp from "@gluestack/framework/types/app/interface/IApp";
import IPlugin from "@gluestack/framework/types/plugin/interface/IPlugin";
import IInstance from "@gluestack/framework/types/plugin/interface/IInstance";
import ILifeCycle from "@gluestack/framework/types/plugin/interface/ILifeCycle";
import IManagesInstances from "@gluestack/framework/types/plugin/interface/IManagesInstances";
import IGlueStorePlugin from "@gluestack/framework/types/store/interface/IGluePluginStore";

import reWriteFile from "./helpers/reWriteFile";
import { writeEnv } from "./helpers/writeEnv";

const { removeSpecialChars } = require("@gluestack/helpers");
const { Workspaces } = require("@gluestack/helpers");

//Do not edit the name of this class
export class GlueStackPlugin implements IPlugin, IManagesInstances, ILifeCycle {
  app: IApp;
  instances: IInstance[];
  type: 'stateless' | 'stateful' | 'devonly' = 'stateless';
  gluePluginStore: IGlueStorePlugin;

  constructor(app: IApp, gluePluginStore: IGlueStorePlugin) {
    this.app = app;
    this.instances = [];
    this.gluePluginStore = gluePluginStore;
  }

  init() {
    //
  }

  destroy() {
    //
  }

  getName(): string {
    return packageJSON.name;
  }

  getVersion(): string {
    return packageJSON.version;
  }

  getType(): 'stateless' | 'stateful' | 'devonly' {
    return this.type;
  }

  getTemplateFolderPath(): string {
    return `${process.cwd()}/node_modules/${this.getName()}/template`;
  }

  getInstallationPath(target: string): string {
    return `./backend/services/${target}`;
  }

  async runPostInstall(instanceName: string, target: string) {
    const instance: PluginInstance = await this.app.createPluginInstance(
      this,
      instanceName,
      this.getTemplateFolderPath(),
      target,
    );

    if (instance) {
      await writeEnv(instance);

      const routerFilePath = `${instance.getInstallationPath()}/router.js`;
      await reWriteFile(routerFilePath, removeSpecialChars(instanceName), 'services');

      // update package.json'S name index with the new instance name
      const pluginPackage = `${instance.getInstallationPath()}/package.json`;
      await reWriteFile(pluginPackage, instanceName, 'INSTANCENAME');

      // update root package.json's workspaces with the new instance name
      const rootPackage = `${process.cwd()}/package.json`;
      await Workspaces.append(rootPackage, instance.getInstallationPath());
    }
  }

  createInstance(
    key: string,
    gluePluginStore: IGlueStorePlugin,
    installationPath: string,
  ): IInstance {
    const instance = new PluginInstance(
      this.app,
      this,
      key,
      gluePluginStore,
      installationPath,
    );
    this.instances.push(instance);
    return instance;
  }

  getInstances(): IInstance[] {
    return this.instances;
  }
}
