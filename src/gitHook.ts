import { readFileSync } from "node:fs";

import { emojify } from "node-emoji";
import chalk from "chalk";

import { exhaustive } from "@/utils";
import { readConfig } from "@/config";

const { kinds: KINDS, scopes: SCOPES, maxMessageLength: MAX_MESSAGE_LENGTH } = readConfig();

const FULL_MSG = readFileSync(process.argv[2])?.toString();
const SPLITTED_FULL_MSG = FULL_MSG?.split("\n")?.[0]?.split(" ");
const KIND = SPLITTED_FULL_MSG[0];
const SCOPE = SPLITTED_FULL_MSG[1];
const MSG = FULL_MSG?.split("\n")[0]?.slice(
    (KIND?.length ?? 0) + 1 + (SCOPES.length === 0 ? 0 : (SCOPE?.length ?? 0) + 1),
);

type Errors = Array<
    | "totally-broken"
    | "bad-kind"
    | "bad-scope"
    | "no-message"
    | "missing-colon"
    | "extra-scope"
    | "start-lowercase"
    | "msg-too-long"
>;

function displayOptions(options: typeof KINDS | typeof SCOPES, emoji = false) {
    console.log(chalk.red("Please use one of the following:"));

    const widestOption = options.map(([option]) => option).sort((a, b) => b.length - a.length)[0];

    const points = Object.fromEntries(
        options.map(([option], i) => {
            const color = i % 2 ? chalk.gray : chalk.white;

            return [option, color(".".repeat(widestOption.length - option.length + 5))];
        }),
    );

    options.forEach(([option, desc]) => {
        console.log(
            `    ${chalk.bold(chalk.blue(option))}${emoji ? ` ${emojify(option)}` : ""}${
                points[option]
            }${desc}`,
        );
    });
}

function detailErrors(errors: Errors) {
    for (const error of errors) {
        switch (error) {
            case "bad-kind":
                process.stdout.write(
                    chalk.red(`◉ "${chalk.bold(chalk.blue(KIND))}" is not a valid commit kind. `),
                );
                displayOptions(KINDS, true);
                break;

            case "bad-scope":
                process.stdout.write(
                    chalk.red(`◉ "${chalk.bold(chalk.blue(SCOPE))}" is not a valid scope. `),
                );
                displayOptions(SCOPES);
                break;

            case "no-message":
                process.stdout.write(chalk.red(`◉ The message should not be empty.`));
                break;

            case "missing-colon":
                console.log(chalk.red("◉ The scope should be terminated by a colon."));
                break;

            case "extra-scope":
                console.log(chalk.red("◉ There are no configured scopes."));
                break;

            case "start-lowercase":
                console.log(chalk.red("◉ The message should start with an uppercase letter."));
                break;

            case "msg-too-long":
                console.log(
                    chalk.red(
                        `◉ The message is too long. It should be ${MAX_MESSAGE_LENGTH} characters` +
                            " or less.",
                    ),
                );
                break;

            case "totally-broken":
                break;

            default:
                exhaustive(error);
        }

        console.log();
    }
}

function error(errors: Errors) {
    if (errors[0] === "totally-broken") {
        console.log(chalk.red("Your commit message is empty or has too many errors."));
    } else {
        console.log("Your commit message contains one or more errors:\n");
        detailErrors(errors);
    }

    const underlined = (underline: boolean, color: chalk.Chalk) =>
        underline || errors[0] === "totally-broken"
            ? (msg: string) => chalk.underline(color(msg))
            : color;

    const styleKind = underlined(errors.includes("bad-kind"), chalk.blue);
    const styleScope = underlined(errors.includes("bad-scope"), chalk.yellow);
    const styleColon = underlined(errors.includes("missing-colon"), chalk.magenta);
    const styleCase = underlined(errors.includes("start-lowercase"), chalk.cyan);

    const example =
        "    " +
        styleKind(KINDS[0][0]) +
        " " +
        (SCOPES.length > 0 ? styleScope(SCOPES[0][0]) + styleColon(":") + " " : "") +
        styleCase("I") +
        "mplement new logs page";

    console.log("\nExample of a correct commit message:\n");
    console.log(chalk.bold(example));

    process.exit(1);
}

if (!FULL_MSG || !SPLITTED_FULL_MSG || !KIND || (SCOPES.length > 0 && !SCOPE)) {
    error(["totally-broken"]);
}

const errors: Errors = [];
if (!KINDS.find(([kind]) => kind === KIND)) {
    errors.push("bad-kind");
}
if (
    SCOPES.length > 0 &&
    !SCOPES.find(
        ([scope]) =>
            scope === SCOPE?.slice(0, SCOPE.length - 1) || scope === SCOPE?.slice(0, SCOPE.length),
    )
) {
    errors.push("bad-scope");
}
if (!MSG) {
    errors.push("no-message");
}
if (SCOPES.length > 0 && SCOPE[SCOPE.length - 1] !== ":") {
    errors.push("missing-colon");
}
if (SCOPES.length === 0 && SCOPE && SCOPE[SCOPE.length - 1] === ":") {
    errors.push("extra-scope");
}
if (MSG && MSG[0] === MSG[0].toLowerCase()) {
    errors.push("start-lowercase");
}
if (MSG && MSG.length > MAX_MESSAGE_LENGTH) {
    errors.push("msg-too-long");
}

if (errors.length > 0) {
    error(errors);
}

process.exit(0);
