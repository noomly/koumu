import chalk from "chalk";
import { emojify } from "node-emoji";
import inquirer from "inquirer";
import inquirerAutocompletePrompt from "inquirer-autocomplete-prompt";

import { ConfigMap } from "@/config";

inquirer.registerPrompt("autocomplete", inquirerAutocompletePrompt);

export async function promptLine(prompt: string, length: number, warning: number): Promise<string> {
    const message: string = (
        await inquirer.prompt({
            type: "input",
            name: "value",
            message: prompt,
            validate: (input: string | undefined) => {
                if (!input || input.length === 0) {
                    return "The commit message cannot be empty.";
                }

                if (input.length > length) {
                    return `The commit message must be <= ${length} characters long.`;
                }

                return true;
            },
            transformer: (input: string | undefined) => {
                const transformed = !input
                    ? ""
                    : input[0].toUpperCase() +
                      input.slice(1, warning) +
                      chalk.yellow(input.slice(warning, length)) +
                      chalk.red(input.slice(length));

                return transformed;
            },
        })
    ).value;

    return message[0].toUpperCase() + message.slice(1);
}

export async function promptSelect(prompt: string, rawOptions: ConfigMap): Promise<string> {
    const widestOption = rawOptions
        .map(([option]) => option)
        .sort((a, b) => b.length - a.length)[0];

    const dots = Object.fromEntries(
        rawOptions.map(([option]) => {
            return [option, ".".repeat(widestOption.length - option.length + 5)];
        }),
    );

    const options = rawOptions.map(([option, desc]) => {
        const emoji = emojify(option);

        return {
            name: `${option}${emoji !== option ? ` ${emoji}` : ""}${dots[option]}${desc}`,
            value: `${option}`,
        };
    });

    return (
        await inquirer.prompt([
            {
                type: "autocomplete",
                name: "value",
                message: prompt,
                source: async (_answersSoFar: unknown, input: string) => {
                    if (!input) {
                        return options;
                    }

                    return options.filter(({ name }) =>
                        name.toLowerCase().includes(input.toLowerCase()),
                    );
                },
            },
        ])
    ).value;
}
