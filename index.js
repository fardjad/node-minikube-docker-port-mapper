#!/usr/bin/env node
import {EventEmitter} from 'events';
import consola from 'consola';

import {getMinikubeDockerEnv, getMinikubeIP} from "./lib/minikube.js";
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
    EventEmitter.defaultMaxListeners = Infinity;

    try {
        getMinikubeIP();
    } catch (error) {
        consola.fatal("Cannot get minikube's VM IP address. Make sure minikube binary is in path and the VM is up and running")
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
