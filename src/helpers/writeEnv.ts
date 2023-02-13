import * as fs from "fs";
import { PluginInstance } from "../PluginInstance";

export async function constructEnvFromJson(instance: PluginInstance) {
  const APP_PORT = await instance.getContainerController().getPortNumber();
  const keys: any = {
    APP_PORT,
    GLUE_PUBLIC: "true"
  };

  return keys;
}

export async function writeEnv(instance: PluginInstance) {
  const path = `${instance.getInstallationPath()}/.env`;
  let env = "";
  const keys: any = await constructEnvFromJson(instance);
  Object.keys(keys).map((key) => {
    env += `${key}="${keys[key]}"
`;
  });

  fs.writeFileSync(path, env);
}
