import chalk from "chalk";
import { existsSync, readFileSync } from "node:fs";

export type ConfigMap = [kind: string, description: string][];

export type Config = {
    version?: string;
    kinds: ConfigMap;
    scopes: ConfigMap;
    maxMessageLength: number;
};

const DEFAULT_CONFIG = {
    maxMessageLength: 72,
};

const RC_PATH = "./koumurc.json";

function getStringMap(rawConfig: Record<string, any>, key: string): ConfigMap {
    let map;
    try {
        map = Object.entries(rawConfig[key]);
    } catch (e) {
        throw new Error(`Invalid map "${key}" in koumurc.json`);
    }

    for (const item of map) {
        if (
            !Array.isArray(item) ||
            item.length !== 2 ||
            typeof item[0] !== "string" ||
            typeof item[1] !== "string"
        ) {
            throw new Error(`Invalid map item for "${key}" in koumurc.json`);
        }
    }

    return map as ConfigMap;
}

function getNumber(rawConfig: Record<string, any>, key: string): number {
    let number;
    try {
        number = Number(rawConfig[key]);
    } catch (e) {
        throw new Error(`Invalid number "${key}" in koumurc.json`);
    }

    return number;
}

export function readConfig(): Config {
    if (!existsSync(RC_PATH)) {
        console.log(
            chalk.red(
                "No configuration file found, Koumu wont check your commit" +
                    " until a `koumurc.json` file is created at root.",
            ),
        );
        process.exit(1);
    }

    const rawConfig = JSON.parse(readFileSync(RC_PATH).toString());

    let kinds: [string, string][];
    let scopes: [string, string][];
    let maxMessageLength: number;

    try {
        kinds = getStringMap(rawConfig, "kinds");
        scopes = getStringMap(rawConfig, "scopes");
        maxMessageLength = rawConfig.maxMessageLength
            ? getNumber(rawConfig, "maxMessageLength")
            : DEFAULT_CONFIG.maxMessageLength;
    } catch (e) {
        console.log(chalk.red((e as any).message));
        process.exit(1);
    }

    return { kinds, scopes, maxMessageLength };
}
