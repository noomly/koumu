import { join } from "node:path";
import { existsSync, readFileSync, statSync } from "node:fs";

import TOML from "@iarna/toml";
import chalk from "chalk";
import { findRoot } from "@/utils";

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

export const RC_PATH = join(findRoot(), ".koumurc.toml");

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
        throw new Error(`Invalid number for "${key}" in koumurc.json`);
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
        throw new Error(`Invalid string for "${key}" in koumurc.json`);
    }

    return string;
}

export function readConfig(): Config {
    if (!existsSync(RC_PATH) || !statSync(RC_PATH).isFile()) {
        console.log(
            chalk.red(
                "No configuration file found, Koumu wont check your commit" +
                    " until a `.koumurc.toml` file is created at the root of your repository.",
            ),
        );
        process.exit(1);
    }

    const rawConfig = TOML.parse(readFileSync(RC_PATH).toString());

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
