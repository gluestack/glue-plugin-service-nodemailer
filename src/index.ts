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
import { replaceSpecialChars } from "./helpers/replace-special-chars";
import { writeEnv } from "./helpers/writeEnv";
import { updateWorkspaces } from "./helpers/update-workspaces";

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
    // await this.checkAlreadyInstalled();
    // if (instanceName !== "email-sender") {
    //   console.log("\x1b[36m");
    //   console.log(
    //     `Install email-sender instance: \`node glue add email-sender email-sender\``,
    //   );
    //   console.log("\x1b[31m");
    //   throw new Error(
    //     "email-sender supports instance name `email-sender` only",
    //   );
    // }

    const instance: PluginInstance = await this.app.createPluginInstance(
      this,
      instanceName,
      this.getTemplateFolderPath(),
      target,
    );

    if (instance) {
      await writeEnv(instance);

      const routerFilePath = `${instance.getInstallationPath()}/router.js`;
      await reWriteFile(routerFilePath, replaceSpecialChars(instanceName), 'services');
    }

    // update package.json'S name index with the new instance name
    const pluginPackage = `${instance.getInstallationPath()}/package.json`;
    await reWriteFile(pluginPackage, instanceName, 'INSTANCENAME');

    // update root package.json's workspaces with the new instance name
    const rootPackage = `${process.cwd()}/package.json`;
    await updateWorkspaces(rootPackage, instance.getInstallationPath());
  }

  // async checkAlreadyInstalled() {
  //   const emailSender: GlueStackPlugin = this.app.getPluginByName(
  //     "glue-plugin-service-nodemailer",
  //   );
  //   //Validation
  //   if (emailSender?.getInstances()?.[0]) {
  //     throw new Error(
  //       `email-sender instance already installed as ${emailSender
  //         .getInstances()[0]
  //         .getName()}`,
  //     );
  //   }
  // }

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
