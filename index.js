#!/usr/bin/env node
import consola from 'consola';

import {checkMinikubeStatus, getMinikubeDockerEnv, getMinikubeIP,} from "./lib/minikube.js";
import {createDockerContainerLifecycleEventEmitter, createDockerFromEnv, getPublishedPorts} from "./lib/docker.js";
import {configureProxies} from "./lib/proxy.js";

const publishedPortsToProxyOptionsList = (ports, destinationHost) => {
    return ports.map(({type, publicPort}) => ({
        protocol: type,
        sourcePort: publicPort,
        destinationHost,
        destinationPort: publicPort,
    }));
};

const main = async () => {
    process.setMaxListeners(0);

    try {
        checkMinikubeStatus();
    } catch (ex) {
        consola.fatal("Invalid minikube status", ex);
        process.exit(-1);
    }

    const docker = createDockerFromEnv(getMinikubeDockerEnv());
    const dockerLifeCycleEventEmitter = createDockerContainerLifecycleEventEmitter(docker);

    const onChange = async () => {
        const proxyOptionsList = publishedPortsToProxyOptionsList(
            await getPublishedPorts(docker),
            getMinikubeIP()
        );


        consola.info("Configuring proxies");
        for (const proxyOptions of proxyOptionsList) {
            consola.info(`${proxyOptions.protocol}:${proxyOptions.sourcePort}->${proxyOptions.destinationHost}:${proxyOptions.destinationPort}`)
        }
        console.log("")
        await configureProxies(proxyOptionsList);
    }

    dockerLifeCycleEventEmitter.on("change", onChange);
    await onChange();
};

main().catch((ex) => {
    console.error(ex);
    process.exit(-1);
});
