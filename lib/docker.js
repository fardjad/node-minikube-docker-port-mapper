import * as fs from "fs";
import * as path from "path";
import {URL} from "url";
import Docker from "dockerode";
import DockerEvents from "docker-events";
import {EventEmitter} from 'events';

const EVENTS = ["start", "kill", "stop", "destroy", "die", "pause", "unpause"];

export const createDockerFromEnv = (env) => {
    const {hostname: dockerHost, port: dockerPort} = new URL(
        env["DOCKER_HOST"]
    );

    return new Docker({
        host: dockerHost,
        port: dockerPort,
        ca: fs.readFileSync(path.join(env["DOCKER_CERT_PATH"], "ca.pem")),
        cert: fs.readFileSync(path.join(env["DOCKER_CERT_PATH"], "cert.pem")),
        key: fs.readFileSync(path.join(env["DOCKER_CERT_PATH"], "key.pem")),
    });
};

export const createDockerContainerLifecycleEventEmitter = (docker) => {
    const dockerEvents = new DockerEvents({docker});
    const ee = new EventEmitter();

    EVENTS.forEach(event => {
        dockerEvents.on(event, message => {
            ee.emit("change", {
                type: event,
                message
            });
        });
    });

    dockerEvents.start();

    return ee;
}

export const getPublishedPorts = async (docker) => {
    const containers = await docker.listContainers();

    return containers
        .flatMap((container) => container.Ports)
        .filter((port) => port.PublicPort != null)
        .map((port) => ({
            publicPort: Number(port.PublicPort),
            type: port.Type,
        }));
};
