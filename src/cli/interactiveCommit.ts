import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

import chalk from "chalk";
import { prompt as getUserInput } from "prompts";
import { emojify } from "node-emoji";

const COMMIT_LENGTH = 60;
const COMMIT_WARNING_AT = 50;

type PromptResult =
    | {
          type: "cancel";
      }
    | {
          type: "submit";
          value: string;
      };

async function promptLine(prompt: string, length: number, warning: number): Promise<PromptResult> {
    return new Promise((resolve, reject) => {
        getUserInput(
            {
                type: "text",
                message: prompt,
                onRender() {
                    if (this._value.length === 1 && this._value === this._value.toLowerCase()) {
                        this._value = this._value.toUpperCase();
                        this.rendered = this._value;
                    }

                    if (this._value.length > length - 1) {
                        this._value = this._value.slice(0, length - 1);
                        this.rendered = this._value;
                        this.cursor = length;
                    }

                    if (this._value.length >= warning) {
                        this.rendered = `${this._value.slice(0, warning)}${chalk.red(
                            this._value.slice(warning),
                        )}`;
                    }
                },
            },
            {
                onCancel: () => {
                    resolve({ type: "cancel" });
                },
                onSubmit: (_: never, choice: string) => {
                    resolve({ type: "submit", value: choice });
                },
            },
        ).catch(reject);
    });
}

async function promptSelect(
    prompt: string,
    rawOptions: Record<string, string>,
): Promise<PromptResult> {
    const optionsEntries = Object.entries(rawOptions);

    const widestOption = optionsEntries
        .map(([option]) => option)
        .sort((a, b) => b.length - a.length)[0];

    const points = Object.fromEntries(
        optionsEntries.map(([option]) => {
            return [option, ".".repeat(widestOption.length - option.length + 5)];
        }),
    );

    const options = optionsEntries.map(([option, desc]) => {
        const emoji = emojify(option);

        return {
            title: `${option}${emoji !== option ? ` ${emoji}` : ""}${points[option]}${desc}`,
            value: `${option}`,
            desc,
        };
    });

    return new Promise((resolve, reject) => {
        getUserInput(
            {
                message: prompt,
                choices: options,
                type: "autocomplete",
                suggest: (input: string, options: [{ title: string; desc: string }]) =>
                    options.filter(
                        (option) => option.desc.includes(input) || option.title.includes(input),
                    ),
            },
            {
                onCancel: () => {
                    resolve({ type: "cancel" });
                },
                onSubmit: (_: never, choice: string) => {
                    resolve({ type: "submit", value: choice });
                },
            },
        ).catch(reject);
    });
}

export default async function commit() {
    const { kinds, scopes }: { kinds: Record<string, string>; scopes: Record<string, string> } =
        JSON.parse(readFileSync("./koumurc.json").toString());

    const kind = await promptSelect("commit kind", kinds);
    if (kind.type === "cancel") {
        process.exit(0);
    }

    const scope =
        Object.values(scopes).length === 0 ? undefined : await promptSelect("commit scope", scopes);
    if (scope?.type === "cancel") {
        process.exit(0);
    }

    const message = await promptLine("commit message", COMMIT_LENGTH, COMMIT_WARNING_AT);
    if (message.type === "cancel") {
        process.exit(0);
    }

    const commitMessage = `${kind.value}${scope ? ` ${scope.value} :` : ""} ${message.value}`;

    spawnSync("git", ["commit", "-m", commitMessage]);
}
