import {execSync} from "child_process";

const NEW_LINE_REGEX = /(\n\r?)+/;
const stripQuotes = (line) => line.replace(/^"?|"?$/g, "");

export const getMinikubeIP = () => {
    return execSync("minikube ip", {
        encoding: "utf-8",
    }).replace(NEW_LINE_REGEX, "");
};

export const getMinikubeDockerEnv = () => {
    const minikubeDockerEnvOutput = execSync("minikube docker-env", {
        encoding: "utf-8",
    });

    return Object.fromEntries(
        minikubeDockerEnvOutput
            .split(NEW_LINE_REGEX)
            .filter((line) => line.startsWith("export "))
            .map((line) => line.replace("export ", ""))
            .map((line) => line.split("="))
            .map(([key, value]) => [key, stripQuotes(value)])
    );
};
