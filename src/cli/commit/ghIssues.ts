import { spawn } from "node:child_process";

import { PromptResult, promptSelect } from "@/cli/commit/prompts";

type PromiseWStatus<T> = { pending: boolean; promise: Promise<T> };
type Issue = { number: number; createdAt: string; title: string };
type IssuesResult = "error" | Issue[];

export function loadGhIssues(): PromiseWStatus<IssuesResult> {
    const promiseWStatus: PromiseWStatus<IssuesResult> = {
        pending: true,
        promise: new Promise<IssuesResult>((resolve) => {
            const gh = spawn("gh", ["issue", "list", "--json", "number,createdAt,title"], {
                timeout: 5000,
            });

            gh.on("error", () => resolve("error"));

            gh.stderr.on("data", () => resolve("error"));

            gh.stdout.on("data", (data) => resolve(JSON.parse(data) as Issue[]));
        }).then((data) => {
            promiseWStatus.pending = false;
            return data;
        }),
    };

    return promiseWStatus;
}

export async function ghIssuesPrompt(
    ghIssues: PromiseWStatus<IssuesResult>,
    isClosingIssue: boolean,
): Promise<PromptResult | "error"> {
    if (ghIssues.pending) {
        console.log("Loading github issues...");
    }

    const issues = await ghIssues.promise;

    if (issues !== "error") {
        return promptSelect(
            `${isClosingIssue ? "closes " : ""}issue`,
            [...issues.values()].map(({ number, title }) => [`#${number}`, title]),
        ).then((issue) =>
            issue.type === "submit" && isClosingIssue
                ? { ...issue, value: `Closes ${issue.value}` }
                : issue,
        );
    } else {
        return "error";
    }
}
