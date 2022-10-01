import { env } from "node:process";
import { homedir, platform as getPlatform } from "node:os";
import { join } from "node:path";
import { existsSync, readFileSync, statSync } from "node:fs";

import TOML from "@iarna/toml";
import chalk from "chalk";

import { findProjectRoot } from "@/utils";

export type ConfigMap = [kind: string, description: string][];

export type Config = {
    version?: string;
    kinds: ConfigMap;
    scopes: ConfigMap;
    maxMessageLength: number;
    mergeKind: string;
};

const DEFAULT_CONFIG = {
    scopes: [],
    maxMessageLength: 72,
    mergeKind: ":twisted_rightwards_arrows:",
};

export function projectRcPath() {
    const projectRootPath = findProjectRoot();

    return projectRootPath && join(projectRootPath, ".koumurc.toml");
}

function homeRcPath(): string | undefined {
    return join(homedir(), ".koumurc.toml");
}

function configRcPath(): string | undefined {
    const platform = getPlatform();
    let configHome: string | undefined;

    if (env.XDG_CONFIG_HOME) {
        configHome = join(env.XDG_CONFIG_HOME, "koumu");
    } else if (platform === "linux" || platform === "android") {
        configHome = join(homedir(), ".config", "koumu");
    } else if (platform === "darwin") {
        configHome = join(homedir(), "Library", "Preferences", "koumu");
    }

    return configHome && join(configHome, "koumurc.toml");
}

// eslint-disable-next-line consistent-return
export function findRcPath(): string {
    const possiblePaths = [projectRcPath(), homeRcPath(), configRcPath()].filter(
        (path): path is string => !!path,
    );

    for (const path of possiblePaths) {
        if (path && existsSync(path) && statSync(path).isFile()) {
            return path;
        }
    }

    console.log(
        chalk.red(
            "No configuration file found, Koumu wont check your commit until one is written " +
                "at one of these paths:\n",
        ),
    );

    for (const path of possiblePaths) {
        console.log(chalk.blue(`    ◉ "${path}"`));
    }

    process.exit(1);
}

function getStringMap(rawConfig: Record<string, any>, key: string): ConfigMap {
    let map;
    try {
        map = Object.entries(rawConfig[key]);
    } catch (e) {
        throw new Error(`Invalid map "${key}" in ${findRcPath()}`);
    }

    for (const item of map) {
        if (
            !Array.isArray(item) ||
            item.length !== 2 ||
            typeof item[0] !== "string" ||
            typeof item[1] !== "string"
        ) {
            throw new Error(`Invalid map item for "${key}" in ${findRcPath()}`);
        }
    }

    return map as ConfigMap;
}

function getNumber(rawConfig: Record<string, any>, key: string): number {
    let number;
    try {
        number = Number(rawConfig[key]);
    } catch (e) {
        throw new Error(`Invalid number for "${key}" in ${findRcPath()}`);
    }

    return number;
}

function getString(rawConfig: Record<string, any>, key: string): string {
    let string;
    try {
        string = rawConfig[key];
        if (typeof string !== "string") {
            throw new Error();
        }
    } catch (e) {
        throw new Error(`Invalid string for "${key}" in ${findRcPath()}`);
    }

    return string;
}

export function readConfig(): Config {
    const rawConfig = TOML.parse(readFileSync(findRcPath()).toString());

    let kinds: [string, string][];
    let scopes: [string, string][];
    let maxMessageLength: number;
    let mergeKind: string;

    try {
        kinds = getStringMap(rawConfig, "kinds");
        scopes = rawConfig.scopes ? getStringMap(rawConfig, "scopes") : DEFAULT_CONFIG.scopes;
        maxMessageLength = rawConfig.maxMessageLength
            ? getNumber(rawConfig, "maxMessageLength")
            : DEFAULT_CONFIG.maxMessageLength;
        mergeKind = rawConfig.mergeKind
            ? getString(rawConfig, "mergeKind")
            : DEFAULT_CONFIG.mergeKind;
    } catch (e) {
        console.log(chalk.red((e as any).message));
        process.exit(1);
    }

    return { kinds, scopes, maxMessageLength, mergeKind };
}
