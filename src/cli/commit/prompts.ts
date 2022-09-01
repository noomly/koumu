import chalk from "chalk";
import { prompt as getUserInput } from "prompts";
import { emojify } from "node-emoji";

import { ConfigMap } from "@/config";

export type PromptResult =
    | {
          type: "cancel";
      }
    | {
          type: "submit";
          value: string;
      };

export async function promptLine(
    prompt: string,
    length: number,
    warning: number,
): Promise<PromptResult> {
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

export async function loopingPromptLine(prompt: string, length: number, warning: number) {
    let message: undefined | PromptResult;

    while (!message || (message.type === "submit" && message.value.length === 0)) {
        message = await promptLine(prompt, length, warning);
    }

    return message;
}

export async function promptSelect(prompt: string, rawOptions: ConfigMap): Promise<PromptResult> {
    const widestOption = rawOptions
        .map(([option]) => option)
        .sort((a, b) => b.length - a.length)[0];

    const points = Object.fromEntries(
        rawOptions.map(([option]) => {
            return [option, ".".repeat(widestOption.length - option.length + 5)];
        }),
    );

    const options = rawOptions.map(([option, desc]) => {
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
                suggest: (input: string, options: [{ title: string; desc: string }]) => {
                    const lowerCaseInput = input.toLowerCase();

                    return options.filter(
                        (option) =>
                            option.desc.toLowerCase().includes(lowerCaseInput) ||
                            option.title.toLowerCase().includes(lowerCaseInput),
                    );
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
